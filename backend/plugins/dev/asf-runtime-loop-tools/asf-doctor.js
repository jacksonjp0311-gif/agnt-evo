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

function dirHas(p, name) {
  try {
    return fs.existsSync(path.join(p, name));
  } catch {
    return false;
  }
}

class AsfRuntimeDoctor {
  constructor() {
    this.name = 'asf-runtime-doctor';
  }

  async execute(params, inputData, workflowEngine) {
    const timeoutSeconds = Number(params?.timeoutSeconds ?? 300);
    const timeoutMs = Math.max(10, Math.min(1800, timeoutSeconds)) * 1000;

    const bootstrapPython = String(params?.pythonExe || 'python');
    const autoFetchRepo = asBool(params?.autoFetchRepo ?? true);
    const repoGitUrl = String(params?.repoGitUrl || 'https://github.com/jacksonjp0311-gif/ai-survival-field.git');
    const repoGitRef = String(params?.repoGitRef || '').trim();
    const updateRepo = asBool(params?.updateRepo ?? true);

    const installSource = String(params?.installSource || 'repo');
    const packageSpec = String(params?.packageSpec || 'git+https://github.com/jacksonjp0311-gif/ai-survival-field.git');
    const upgradePackage = asBool(params?.upgradePackage ?? false);

    const checks = [];
    const add = (id, ok, message, data = null) => {
      checks.push({ id, ok: !!ok, message: String(message || ''), data });
    };

    try {
      const userId = String(workflowEngine?.userId ?? 'default');
      const pluginDataRoot = path.join(getUserDataPath(), 'plugin-data', 'asf-runtime-loop-tools', userId);
      const pyRoot = path.join(pluginDataRoot, 'python');
      const venvDir = path.join(pyRoot, 'venv');
      const venvPython = getVenvPythonPath(venvDir);
      ensureDir(pyRoot);

      // Resolve repo root
      let repoAbs = String(params?.repoRoot || '').trim();
      let repoCloned = false;
      let repoDir = null;

      if (!repoAbs) {
        if (!autoFetchRepo) {
          add('repo', false, 'repoRoot not provided and autoFetchRepo=false. Provide repoRoot or enable autoFetchRepo.', null);
          return { ok: false, checks, venvDir, venvPython, repoDir: null };
        }

        // Need git
        const gitV = run('git', ['--version'], { cwd: pluginDataRoot, env: process.env, timeoutMs: 15000 });
        add('git', gitV.ok, gitV.ok ? `git available: ${gitV.stdout.trim()}` : 'git not found in PATH. Install Git to use autoFetchRepo.', gitV.ok ? null : { stderr: gitV.stderr, error: gitV.error });
        if (!gitV.ok) {
          return { ok: false, checks, venvDir, venvPython, repoDir: null };
        }

        const repoParent = path.join(pluginDataRoot, 'repo');
        const targetDir = path.join(repoParent, 'ai-survival-field');
        ensureDir(repoParent);

        if (!fs.existsSync(targetDir)) {
          const cloneArgs = ['clone', '--depth', '1'];
          if (repoGitRef) cloneArgs.push('--branch', repoGitRef);
          cloneArgs.push(repoGitUrl, targetDir);
          const cl = run('git', cloneArgs, { cwd: repoParent, env: process.env, timeoutMs: Math.min(timeoutMs, 10 * 60 * 1000) });
          add('git_clone', cl.ok, cl.ok ? `Cloned ASF repo to ${targetDir}` : 'git clone failed.', cl.ok ? null : { stdout: cl.stdout, stderr: cl.stderr, error: cl.error });
          if (!cl.ok) {
            return { ok: false, checks, venvDir, venvPython, repoDir: targetDir };
          }
          repoCloned = true;
        } else if (updateRepo) {
          const pull = run('git', ['pull', '--ff-only'], { cwd: targetDir, env: process.env, timeoutMs: Math.min(timeoutMs, 120000) });
          add('git_pull', pull.ok, pull.ok ? 'Repo updated (git pull --ff-only).' : 'Repo update failed (git pull --ff-only).', pull.ok ? null : { stdout: pull.stdout, stderr: pull.stderr, error: pull.error });
          // Do not hard-fail on pull; repo might be detached or offline.
        }

        repoAbs = targetDir;
        repoDir = targetDir;
      } else {
        repoAbs = path.resolve(repoAbs);
        repoDir = repoAbs;
      }

      add('repo_exists', fs.existsSync(repoAbs), fs.existsSync(repoAbs) ? `repoRoot exists: ${repoAbs}` : `repoRoot not found: ${repoAbs}`, null);
      if (!fs.existsSync(repoAbs)) {
        return { ok: false, checks, venvDir, venvPython, repoDir };
      }

      const structureOk = dirHas(repoAbs, 'asf') && dirHas(repoAbs, 'policies') && dirHas(repoAbs, 'tests') && dirHas(repoAbs, 'pyproject.toml');
      add('repo_structure', structureOk, structureOk ? 'Repo structure looks like ai-survival-field (asf/, policies/, tests/, pyproject.toml).' : 'Repo root missing expected ASF layout (need asf/, policies/, tests/, pyproject.toml).', null);

      // Python availability
      const pyV = run(bootstrapPython, ['--version'], { cwd: repoAbs, env: process.env, timeoutMs: 15000 });
      add('python', pyV.ok, pyV.ok ? `Python ok: ${pyV.stdout.trim() || pyV.stderr.trim()}` : 'Python not found / failed to run.', pyV.ok ? null : { stderr: pyV.stderr, error: pyV.error });
      if (!pyV.ok) {
        return { ok: false, checks, venvDir, venvPython, repoDir };
      }

      // Venv create if missing
      if (!fs.existsSync(venvPython)) {
        ensureDir(venvDir);
        const vr = run(bootstrapPython, ['-m', 'venv', venvDir], { cwd: repoAbs, env: process.env, timeoutMs });
        add('venv_create', vr.ok, vr.ok ? 'Created venv successfully.' : 'Failed to create venv.', vr.ok ? null : { stdout: vr.stdout, stderr: vr.stderr, error: vr.error });
        if (!vr.ok) {
          return { ok: false, checks, venvDir, venvPython, repoDir };
        }
      } else {
        add('venv_exists', true, 'Venv already exists.', { venvPython });
      }

      // Pip tooling upgrade
      const pipUpgrade = run(venvPython, ['-m', 'pip', 'install', '--upgrade', 'pip', 'setuptools', 'wheel'], { cwd: repoAbs, env: process.env, timeoutMs });
      add('pip_tooling', pipUpgrade.ok, pipUpgrade.ok ? 'pip/setuptools/wheel upgraded.' : 'Failed to upgrade pip tooling.', pipUpgrade.ok ? null : { stdout: pipUpgrade.stdout, stderr: pipUpgrade.stderr, error: pipUpgrade.error });
      if (!pipUpgrade.ok) {
        return { ok: false, checks, venvDir, venvPython, repoDir };
      }

      // Install/import checks
      let install = { attempted: false, ok: true, installSource, packageSpec, upgradePackage, pip: null, show: null };

      if (installSource === 'repo') {
        // Install editable from the repo root
        install.attempted = true;
        const args = ['-m', 'pip', 'install'];
        if (upgradePackage) args.push('--upgrade');
        args.push('-e', repoAbs);
        const ir = run(venvPython, args, { cwd: repoAbs, env: process.env, timeoutMs: Math.min(timeoutMs, 10 * 60 * 1000) });
        install.ok = ir.ok;
        install.pip = { stdout: ir.stdout, stderr: ir.stderr, exitCode: ir.status, error: ir.error };
        add('pip_install', ir.ok, ir.ok ? 'Installed ASF-R from repo (editable).' : 'pip install -e <repoRoot> failed.', ir.ok ? null : install.pip);
        if (!ir.ok) {
          return { ok: false, checks, venvDir, venvPython, repoDir, install };
        }
      } else {
        install.attempted = true;
        const args = ['-m', 'pip', 'install'];
        if (upgradePackage) args.push('--upgrade');
        args.push(packageSpec);
        const ir = run(venvPython, args, { cwd: repoAbs, env: process.env, timeoutMs: Math.min(timeoutMs, 10 * 60 * 1000) });
        install.ok = ir.ok;
        install.pip = { stdout: ir.stdout, stderr: ir.stderr, exitCode: ir.status, error: ir.error };
        add('pip_install', ir.ok, ir.ok ? `Installed ASF-R from packageSpec.` : 'pip install packageSpec failed.', ir.ok ? null : install.pip);
        if (!ir.ok) {
          return { ok: false, checks, venvDir, venvPython, repoDir, install };
        }
      }

      // Import test
      const imp = run(venvPython, ['-c', 'import asf, json; print(json.dumps({"ok": True, "asf_file": getattr(asf, "__file__", None)}))'], { cwd: repoAbs, env: process.env, timeoutMs: 30000 });
      add('import_asf', imp.ok, imp.ok ? 'Python can import asf.' : 'Python cannot import asf.', imp.ok ? imp.stdout.trim() : { stdout: imp.stdout, stderr: imp.stderr, error: imp.error });

      // Write check into repo (.asf_loop_runs)
      const canWrite = (() => {
        try {
          const testDir = path.join(repoAbs, '.asf_loop_runs');
          ensureDir(testDir);
          const f = path.join(testDir, '.agnt_write_test');
          fs.writeFileSync(f, String(Date.now()));
          fs.unlinkSync(f);
          return true;
        } catch {
          return false;
        }
      })();
      add('repo_write', canWrite, canWrite ? 'Can write to .asf_loop_runs (required).' : 'Cannot write to .asf_loop_runs. Fix permissions or choose a different repoRoot.', null);

      const ok = checks.every((c) => c.ok);
      return {
        ok,
        checks,
        repoDir,
        repoCloned,
        venvDir,
        venvPython,
        install,
      };
    } catch (error) {
      add('unexpected', false, error?.message || String(error), null);
      return { ok: false, checks, error: error?.message || String(error) };
    }
  }
}

export default new AsfRuntimeDoctor();
