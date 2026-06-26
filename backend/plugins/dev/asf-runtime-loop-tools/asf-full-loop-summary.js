import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';

function asBool(v) {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  if (typeof v === 'string') return ['true', '1', 'yes', 'on'].includes(v.trim().toLowerCase());
  return false;
}

function run(cmd, args, { cwd, env, timeoutMs }) {
  const r = spawnSync(cmd, args, {
    cwd,
    env,
    encoding: 'utf8',
    timeout: timeoutMs,
    windowsHide: true,
  });
  return {
    ok: r.status === 0,
    status: r.status,
    signal: r.signal,
    stdout: r.stdout || '',
    stderr: r.stderr || '',
    error: r.error ? String(r.error.message || r.error) : '',
  };
}

function parseJsonFromStdout(stdout) {
  const s = (stdout || '').trim();
  if (!s) return null;
  const first = s.indexOf('{');
  const last = s.lastIndexOf('}');
  if (first === -1 || last === -1 || last <= first) return null;
  const maybe = s.slice(first, last + 1);
  return JSON.parse(maybe);
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function getUserDataPath() {
  return process.env.USER_DATA_PATH || process.cwd();
}

function getVenvPythonPath(venvDir) {
  const isWin = process.platform === 'win32';
  return path.join(venvDir, isWin ? 'Scripts' : 'bin', isWin ? 'python.exe' : 'python');
}

class AsfFullLoopSummary {
  constructor() {
    this.name = 'asf-full-loop-summary';
  }

  async execute(params, inputData, workflowEngine) {
    try {
      const allowWrites = asBool(params?.allowWrites);
      const runTests = asBool(params?.runTests);
      const geometry = asBool(params?.geometry);
      const timeoutSeconds = Number(params?.timeoutSeconds ?? 900);
      const timeoutMs = Math.max(10, Math.min(1800, timeoutSeconds)) * 1000;

      // Repo resolution
      const repoRootRaw = String(params?.repoRoot || '').trim();
      const autoFetchRepo = asBool(params?.autoFetchRepo ?? true);
      const repoGitUrl = String(params?.repoGitUrl || 'https://github.com/jacksonjp0311-gif/ai-survival-field.git');
      const repoGitRef = String(params?.repoGitRef || '').trim();
      const updateRepo = asBool(params?.updateRepo ?? true);

      // Python / install
      const bootstrapPython = String(params?.pythonExe || 'python');
      const installSource = String(params?.installSource || 'repo'); // repo | packageSpec
      const packageSpec = String(params?.packageSpec || 'git+https://github.com/jacksonjp0311-gif/ai-survival-field.git');
      const upgradePackage = asBool(params?.upgradePackage ?? false);

      if (!allowWrites) {
        return {
          success: false,
          error:
            'Refusing to run ASF full loop without allowWrites=true. ASF-R writes .asf_loop_runs and may perform bounded local repairs within policy scope.',
        };
      }

      const userId = String(workflowEngine?.userId ?? 'default');
      const pluginDataRoot = path.join(getUserDataPath(), 'plugin-data', 'asf-runtime-loop-tools', userId);

      // Resolve repoAbs either from repoRoot or via auto-fetch
      let repoAbs = repoRootRaw ? path.resolve(repoRootRaw) : '';
      let repoCloned = false;

      if (!repoAbs) {
        if (!autoFetchRepo) {
          return { success: false, error: 'repoRoot is blank and autoFetchRepo=false. Provide repoRoot or enable autoFetchRepo.' };
        }

        const gitV = run('git', ['--version'], { cwd: pluginDataRoot, env: process.env, timeoutMs: 15000 });
        if (!gitV.ok) {
          return {
            success: false,
            error: 'git not found in PATH. Install Git or provide repoRoot manually.',
            stderr: gitV.stderr,
          };
        }

        const repoParent = path.join(pluginDataRoot, 'repo');
        const targetDir = path.join(repoParent, 'ai-survival-field');
        ensureDir(repoParent);

        if (!fs.existsSync(targetDir)) {
          const cloneArgs = ['clone', '--depth', '1'];
          if (repoGitRef) cloneArgs.push('--branch', repoGitRef);
          cloneArgs.push(repoGitUrl, targetDir);
          const cl = run('git', cloneArgs, { cwd: repoParent, env: process.env, timeoutMs: Math.min(timeoutMs, 10 * 60 * 1000) });
          if (!cl.ok) {
            return {
              success: false,
              error: 'git clone failed. See stderr for details.',
              stdout: cl.stdout,
              stderr: cl.stderr,
            };
          }
          repoCloned = true;
        } else if (updateRepo) {
          // best-effort update; do not hard-fail
          run('git', ['pull', '--ff-only'], { cwd: targetDir, env: process.env, timeoutMs: 120000 });
        }

        repoAbs = targetDir;
      }

      if (!fs.existsSync(repoAbs)) {
        return { success: false, error: `repoRoot not found: ${repoAbs}` };
      }

      // Tool-managed Python environment
      const pyRoot = path.join(pluginDataRoot, 'python');
      const venvDir = path.join(pyRoot, 'venv');
      ensureDir(pyRoot);

      const venvPython = getVenvPythonPath(venvDir);
      let venvCreated = false;
      if (!fs.existsSync(venvPython)) {
        ensureDir(venvDir);
        const vr = run(bootstrapPython, ['-m', 'venv', venvDir], { cwd: repoAbs, env: process.env, timeoutMs });
        if (!vr.ok) {
          return {
            success: false,
            error: `Failed to create venv (exit=${vr.status})${vr.error ? `: ${vr.error}` : ''}`,
            stdout: vr.stdout,
            stderr: vr.stderr,
            venvDir,
          };
        }
        venvCreated = true;
      }

      const install = {
        attempted: false,
        ok: true,
        installSource,
        packageSpec,
        upgraded: upgradePackage,
        venvCreated,
        pip: null,
        show: null,
      };

      // Upgrade pip tooling
      const pipUpgrade = run(venvPython, ['-m', 'pip', 'install', '--upgrade', 'pip', 'setuptools', 'wheel'], {
        cwd: repoAbs,
        env: process.env,
        timeoutMs,
      });
      if (!pipUpgrade.ok) {
        return {
          success: false,
          error: `Failed to upgrade pip tooling (exit=${pipUpgrade.status})${pipUpgrade.error ? `: ${pipUpgrade.error}` : ''}`,
          stdout: pipUpgrade.stdout,
          stderr: pipUpgrade.stderr,
          venvDir,
          venvPython,
        };
      }

      // Install ASF-R
      install.attempted = true;
      if (installSource === 'repo') {
        const args = ['-m', 'pip', 'install'];
        if (upgradePackage) args.push('--upgrade');
        args.push('-e', repoAbs);
        const ir = run(venvPython, args, { cwd: repoAbs, env: process.env, timeoutMs: Math.min(timeoutMs, 10 * 60 * 1000) });
        install.ok = ir.ok;
        install.pip = { stdout: ir.stdout, stderr: ir.stderr, exitCode: ir.status, error: ir.error };
        if (!ir.ok) {
          return {
            success: false,
            error: `pip install -e repoRoot failed (exit=${ir.status})${ir.error ? `: ${ir.error}` : ''}`,
            venvDir,
            venvPython,
            install,
          };
        }
      } else {
        const args = ['-m', 'pip', 'install'];
        if (upgradePackage) args.push('--upgrade');
        args.push(packageSpec);
        const ir = run(venvPython, args, { cwd: repoAbs, env: process.env, timeoutMs: Math.min(timeoutMs, 10 * 60 * 1000) });
        install.ok = ir.ok;
        install.pip = { stdout: ir.stdout, stderr: ir.stderr, exitCode: ir.status, error: ir.error };
        if (!ir.ok) {
          return {
            success: false,
            error: `pip install failed (exit=${ir.status})${ir.error ? `: ${ir.error}` : ''}`,
            venvDir,
            venvPython,
            install,
          };
        }
      }

      const showAfter = run(venvPython, ['-m', 'pip', 'show', 'ai-survival-field'], { cwd: repoAbs, env: process.env, timeoutMs: 30000 });
      install.show = { stdout: showAfter.stdout, stderr: showAfter.stderr, exitCode: showAfter.status, error: showAfter.error };

      // Execute in the target repo root
      const env = {
        ...process.env,
        PYTHONPATH: repoAbs,
      };

      let tests = null;
      if (runTests) {
        const tr = run(venvPython, ['-m', 'unittest', 'discover', 'tests'], { cwd: repoAbs, env, timeoutMs });
        tests = {
          ok: tr.ok,
          exitCode: tr.status,
          stdout: tr.stdout,
          stderr: tr.stderr,
          error: tr.error,
        };
        if (!tr.ok) {
          return {
            success: false,
            error: 'Tests failed; refusing to continue to full loop.',
            tests,
            repoDir: repoAbs,
            repoCloned,
            venvDir,
            venvPython,
            install,
          };
        }
      }

      const args = ['-m', 'asf.full_loop', '--root', repoAbs];
      if (geometry) args.push('--geometry');

      const rr = run(venvPython, args, { cwd: repoAbs, env, timeoutMs });
      if (!rr.ok) {
        return {
          success: false,
          error: `asf.full_loop failed (exit=${rr.status})${rr.error ? `: ${rr.error}` : ''}`,
          stdout: rr.stdout,
          stderr: rr.stderr,
          tests,
          repoDir: repoAbs,
          repoCloned,
          venvDir,
          venvPython,
          install,
        };
      }

      const header = parseJsonFromStdout(rr.stdout);
      const runId = header?.run_id || '';
      const summaryRel = header?.summary_path || '';
      const summaryAbs = summaryRel ? path.resolve(repoAbs, summaryRel) : '';

      if (!summaryAbs || !fs.existsSync(summaryAbs)) {
        return {
          success: false,
          error: `Could not locate summary.json (reported: ${summaryRel || '(none)'})`,
          runId,
          stdout: rr.stdout,
          stderr: rr.stderr,
          tests,
          repoDir: repoAbs,
          repoCloned,
          venvDir,
          venvPython,
          install,
        };
      }

      const summaryRaw = fs.readFileSync(summaryAbs, 'utf8');
      const summary = JSON.parse(summaryRaw);
      const decision = summary.decision || {};

      return {
        success: true,
        runId: summary.run_id || runId,
        summaryPath: summaryAbs,
        repoDir: repoAbs,
        repoCloned,
        venvDir,
        venvPython,
        install,
        decision,
        blockedActions: decision.blocked_actions || [],
        permittedActions: decision.permitted_actions || [],
        missingGates: decision.missing_gates || [],
        permissionCeiling: summary.permission_ceiling || decision.permission_ceiling || '',
        nonClaimLock: summary.non_claim_lock || '',
        woundPackage: summary.wound_package || null,
        ciEvidence: summary.ci_evidence || null,
        tests,
        stdout: rr.stdout,
        stderr: rr.stderr,
        error: '',
      };
    } catch (error) {
      console.error('[asf-full-loop-summary] Error:', error);
      return { success: false, error: error?.message || String(error) };
    }
  }
}

export default new AsfFullLoopSummary();
