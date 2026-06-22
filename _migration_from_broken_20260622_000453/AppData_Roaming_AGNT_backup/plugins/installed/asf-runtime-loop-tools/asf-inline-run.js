import fs from 'fs';
import path from 'path';
import net from 'net';
import { spawnSync, spawn } from 'child_process';

function asBool(v) {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  if (typeof v === 'string') return ['true', '1', 'yes', 'on'].includes(v.trim().toLowerCase());
  return false;
}

function asInt(v, def, min, max) {
  const n = Number.parseInt(String(v ?? def), 10);
  if (Number.isNaN(n)) return def;
  return Math.max(min, Math.min(max, n));
}

function nowISO() {
  return new Date().toISOString();
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

function safeReadJSON(p) {
  try {
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

function safeWriteJSON(p, obj) {
  try {
    ensureDir(path.dirname(p));
    fs.writeFileSync(p, JSON.stringify(obj, null, 2));
    return true;
  } catch {
    return false;
  }
}

function getUserDataPath() {
  return process.env.USER_DATA_PATH || process.cwd();
}

function getVenvPythonPath(venvDir) {
  const isWin = process.platform === 'win32';
  return path.join(venvDir, isWin ? 'Scripts' : 'bin', isWin ? 'python.exe' : 'python');
}

async function isPortOpen(port, host = '127.0.0.1') {
  return await new Promise((resolve) => {
    const s = net.createConnection({ port, host });
    s.on('connect', () => {
      s.end();
      resolve(true);
    });
    s.on('error', () => resolve(false));
  });
}

async function getFreePort(host = '127.0.0.1') {
  return await new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.unref();
    srv.on('error', reject);
    srv.listen(0, host, () => {
      const addr = srv.address();
      const port = typeof addr === 'object' && addr ? addr.port : null;
      srv.close(() => resolve(port));
    });
  });
}

function isProcessAlive(pid) {
  if (!pid || typeof pid !== 'number') return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function isGeometryHealthy(geometryUrl) {
  if (!geometryUrl) return false;
  try {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 2000);
    const r = await fetch(geometryUrl.replace(/\/+$/, '') + '/state.json', { signal: ctrl.signal });
    clearTimeout(to);
    if (!r.ok) return false;
    const text = await r.text();
    return text.includes('ASF-TRIADIC-GEOMETRY-STATE');
  } catch {
    return false;
  }
}

function startDetached(cmd, args, { cwd, env, logFile }) {
  const out = logFile ? fs.openSync(logFile, 'a') : 'ignore';
  const err = logFile ? fs.openSync(logFile, 'a') : 'ignore';
  const child = spawn(cmd, args, {
    cwd,
    env,
    detached: true,
    stdio: ['ignore', out, err],
    windowsHide: true,
  });
  child.unref();
  return child.pid;
}

function formatSummaryMarkdown(out) {
  const d = out?.decision || {};
  const missing = Array.isArray(out?.missingGates) ? out.missingGates : [];
  const lines = [];

  lines.push('# ASF-R Full Loop Summary');
  lines.push('');
  lines.push('**Non-claim lock:** ' + (out?.nonClaimLock || d.non_claim_lock || ''));
  lines.push('');

  if (out?.geometryUrl) {
    lines.push('## Geometry Console (read-only)');
    lines.push(`- ${out.geometryUrl}`);
    lines.push('');
  }

  lines.push('## Decision');
  lines.push('- **status:** ' + (d.status || ''));
  lines.push('- **action:** ' + (d.action || ''));
  lines.push('- **permission_ceiling:** ' + (out?.permissionCeiling || d.permission_ceiling || ''));
  lines.push('');

  lines.push('## Blocked actions');
  lines.push((out?.blockedActions || []).map((x) => '- ' + x).join('\n') || '- (none)');
  lines.push('');

  lines.push('## Permitted actions');
  lines.push((out?.permittedActions || []).map((x) => '- ' + x).join('\n') || '- (none)');
  lines.push('');

  lines.push('## Missing gates');
  if (missing.length === 0) {
    lines.push('- (none)');
  } else {
    for (const g of missing) {
      lines.push(
        `- **${g.gate_id || ''}** (${g.gate_type || ''}): ${g.description || ''} — next: **${g.next_step || ''}** (evidence: ${g.required_evidence || ''})`
      );
    }
  }
  lines.push('');

  lines.push('## Artifacts');
  lines.push('- **runId:** ' + (out?.runId || ''));
  lines.push('- **summaryPath:** ' + (out?.summaryPath || ''));

  if (out?.steps && Array.isArray(out.steps) && out.steps.length) {
    lines.push('');
    lines.push('## Execution steps');
    for (const s of out.steps) {
      const ms = typeof s.ms === 'number' ? `${s.ms}ms` : '';
      lines.push(`- ${s.ok ? '[OK]' : '[FAIL]'} ${s.phase}${ms ? ` (${ms})` : ''}${s.message ? ` — ${s.message}` : ''}`);
    }
  }

  return lines.join('\n');
}

class AsfInlineRun {
  constructor() {
    this.name = 'asf-inline-run';
  }

  async execute(params, inputData, workflowEngine) {
    const startedAt = nowISO();
    const steps = [];
    let phase = 'init';

    const step = async (phaseName, fn) => {
      phase = phaseName;
      const t0 = Date.now();
      try {
        const result = await fn();
        steps.push({ phase: phaseName, ok: true, startedAt: new Date(t0).toISOString(), endedAt: nowISO(), ms: Date.now() - t0, message: '' });
        return result;
      } catch (err) {
        steps.push({
          phase: phaseName,
          ok: false,
          startedAt: new Date(t0).toISOString(),
          endedAt: nowISO(),
          ms: Date.now() - t0,
          message: err?.message || String(err),
        });
        throw err;
      }
    };

    const fail = (message, extra = {}) => {
      const out = {
        success: false,
        phase,
        startedAt,
        endedAt: nowISO(),
        durationMs: Date.now() - new Date(startedAt).getTime(),
        steps,
        error: message,
        ...extra,
      };
      out.summaryMarkdown = formatSummaryMarkdown(out);
      return out;
    };

    try {
      const allowWrites = asBool(params?.allowWrites);
      const runTests = asBool(params?.runTests);
      const geometryArtifacts = asBool(params?.geometryArtifacts);
      const launchGeometryServer = asBool(params?.launchGeometryServer);

      const timeoutSeconds = asInt(params?.timeoutSeconds, 1200, 10, 3600);
      const timeoutMs = timeoutSeconds * 1000;

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

      // Geometry server
      const geometryHost = String(params?.geometryHost || '127.0.0.1');
      let geometryPort = Number(params?.geometryPort ?? 8765);
      if (!Number.isFinite(geometryPort)) geometryPort = 8765;
      geometryPort = Math.max(0, Math.min(65535, Math.trunc(geometryPort)));
      const autoPortOnConflict = asBool(params?.autoPortOnConflict ?? true);

      if (!allowWrites) {
        return fail('Refusing to run without allowWrites=true. ASF-R writes .asf_loop_runs and may perform bounded local repairs within policy scope.');
      }

      const userId = String(workflowEngine?.userId ?? 'default');
      const pluginDataRoot = path.join(getUserDataPath(), 'plugin-data', 'asf-runtime-loop-tools', userId);

      // Resolve repoAbs either from repoRoot or via auto-fetch
      let repoAbs = repoRootRaw ? path.resolve(repoRootRaw) : '';
      let repoCloned = false;

      await step('resolve_repo', async () => {
        if (repoAbs) {
          if (!fs.existsSync(repoAbs)) throw new Error(`repoRoot not found: ${repoAbs}`);
          return;
        }
        if (!autoFetchRepo) throw new Error('repoRoot is blank and autoFetchRepo=false. Provide repoRoot or enable autoFetchRepo.');

        const gitV = run('git', ['--version'], { cwd: pluginDataRoot, env: process.env, timeoutMs: 15000 });
        if (!gitV.ok) throw new Error('git not found in PATH. Install Git or provide repoRoot manually.');

        const repoParent = path.join(pluginDataRoot, 'repo');
        const targetDir = path.join(repoParent, 'ai-survival-field');
        ensureDir(repoParent);

        if (!fs.existsSync(targetDir)) {
          const cloneArgs = ['clone', '--depth', '1'];
          if (repoGitRef) cloneArgs.push('--branch', repoGitRef);
          cloneArgs.push(repoGitUrl, targetDir);
          const cl = run('git', cloneArgs, { cwd: repoParent, env: process.env, timeoutMs: Math.min(timeoutMs, 10 * 60 * 1000) });
          if (!cl.ok) {
            throw new Error(`git clone failed: ${cl.stderr || cl.stdout || cl.error || 'unknown error'}`);
          }
          repoCloned = true;
        } else if (updateRepo) {
          // best-effort
          run('git', ['pull', '--ff-only'], { cwd: targetDir, env: process.env, timeoutMs: 120000 });
        }
        repoAbs = targetDir;
      });

      if (!fs.existsSync(repoAbs)) {
        return fail(`repoRoot not found: ${repoAbs}`);
      }

      // Tool-managed Python environment
      const pyRoot = path.join(pluginDataRoot, 'python');
      const venvDir = path.join(pyRoot, 'venv');
      ensureDir(pyRoot);

      const venvPython = getVenvPythonPath(venvDir);
      let venvCreated = false;

      await step('ensure_venv', async () => {
        if (!fs.existsSync(venvPython)) {
          ensureDir(venvDir);
          const vr = run(bootstrapPython, ['-m', 'venv', venvDir], { cwd: repoAbs, env: process.env, timeoutMs });
          if (!vr.ok) throw new Error(`Failed to create venv (exit=${vr.status}) ${vr.stderr || vr.error || ''}`.trim());
          venvCreated = true;
        }
      });

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

      await step('pip_tooling', async () => {
        const pipUpgrade = run(venvPython, ['-m', 'pip', 'install', '--upgrade', 'pip', 'setuptools', 'wheel'], {
          cwd: repoAbs,
          env: process.env,
          timeoutMs,
        });
        if (!pipUpgrade.ok) throw new Error(`Failed to upgrade pip tooling (exit=${pipUpgrade.status}) ${pipUpgrade.stderr || pipUpgrade.error || ''}`.trim());
      });

      await step('install_asf', async () => {
        install.attempted = true;
        if (installSource === 'repo') {
          const args = ['-m', 'pip', 'install'];
          if (upgradePackage) args.push('--upgrade');
          args.push('-e', repoAbs);
          const ir = run(venvPython, args, { cwd: repoAbs, env: process.env, timeoutMs: Math.min(timeoutMs, 10 * 60 * 1000) });
          install.ok = ir.ok;
          install.pip = { stdout: ir.stdout, stderr: ir.stderr, exitCode: ir.status, error: ir.error };
          if (!ir.ok) throw new Error(`pip install -e failed (exit=${ir.status}) ${ir.stderr || ir.error || ''}`.trim());
        } else {
          const args = ['-m', 'pip', 'install'];
          if (upgradePackage) args.push('--upgrade');
          args.push(packageSpec);
          const ir = run(venvPython, args, { cwd: repoAbs, env: process.env, timeoutMs: Math.min(timeoutMs, 10 * 60 * 1000) });
          install.ok = ir.ok;
          install.pip = { stdout: ir.stdout, stderr: ir.stderr, exitCode: ir.status, error: ir.error };
          if (!ir.ok) throw new Error(`pip install failed (exit=${ir.status}) ${ir.stderr || ir.error || ''}`.trim());
        }
      });

      await step('pip_show', async () => {
        const showAfter = run(venvPython, ['-m', 'pip', 'show', 'ai-survival-field'], { cwd: repoAbs, env: process.env, timeoutMs: 30000 });
        install.show = { stdout: showAfter.stdout, stderr: showAfter.stderr, exitCode: showAfter.status, error: showAfter.error };
      });

      // Geometry server management
      let geometryUrl = '';
      let geometryStarted = false;
      let geometryPid = null;
      let geometryLogPath = '';
      let geometryServerStatus = 'disabled';
      let geometryChosenPort = geometryPort;

      await step('geometry_server', async () => {
        if (!launchGeometryServer) {
          geometryServerStatus = 'disabled';
          return;
        }

        const geoDir = path.join(pluginDataRoot, 'geometry');
        ensureDir(geoDir);
        geometryLogPath = path.join(geoDir, 'geometry-server.log');
        const metaPath = path.join(geoDir, 'geometry-server.json');
        const meta = safeReadJSON(metaPath);

        // Try reuse if meta indicates healthy server
        if (meta?.pid && meta?.geometryUrl) {
          if (isProcessAlive(meta.pid) && (await isGeometryHealthy(meta.geometryUrl))) {
            geometryPid = meta.pid;
            geometryUrl = meta.geometryUrl;
            try {
              const u = new URL(meta.geometryUrl);
              geometryChosenPort = Number(u.port || geometryPort || 8765) || 8765;
            } catch {
              geometryChosenPort = geometryPort || 8765;
            }
            geometryServerStatus = 'already_running';
            return;
          }
        }

        // Choose port
        if (geometryChosenPort === 0) {
          geometryChosenPort = await getFreePort(geometryHost);
        } else {
          const open = await isPortOpen(geometryChosenPort, geometryHost);
          if (open && autoPortOnConflict) {
            geometryChosenPort = await getFreePort(geometryHost);
          }
        }

        geometryUrl = `http://${geometryHost}:${geometryChosenPort}`;

        // Start server
        const pid = startDetached(
          venvPython,
          ['-m', 'asf.cli', 'geometry', 'serve', '--root', repoAbs, '--host', geometryHost, '--port', String(geometryChosenPort)],
          { cwd: repoAbs, env: { ...process.env, PYTHONPATH: repoAbs }, logFile: geometryLogPath }
        );
        geometryPid = pid;
        geometryStarted = true;
        geometryServerStatus = 'started';
        safeWriteJSON(metaPath, { pid, geometryUrl, repoDir: repoAbs, startedAt: nowISO() });

        // Wait until healthy
        for (let i = 0; i < 40; i++) {
          if (await isGeometryHealthy(geometryUrl)) return;
          await new Promise((r) => setTimeout(r, 250));
        }
        geometryServerStatus = 'start_attempted_not_ready';
      });

      // Execute in the target repo root
      const env = { ...process.env, PYTHONPATH: repoAbs };

      let tests = null;
      if (runTests) {
        const tr = await step('run_tests', async () => {
          return run(venvPython, ['-m', 'unittest', 'discover', 'tests'], { cwd: repoAbs, env, timeoutMs });
        });
        tests = { ok: tr.ok, exitCode: tr.status, stdout: tr.stdout, stderr: tr.stderr, error: tr.error };
        if (!tr.ok) {
          const out = {
            success: false,
            phase,
            startedAt,
            endedAt: nowISO(),
            durationMs: Date.now() - new Date(startedAt).getTime(),
            steps,
            error: 'Tests failed; refusing to continue to full loop.',
            tests,
            repoDir: repoAbs,
            repoCloned,
            venvDir,
            venvPython,
            install,
            geometryUrl,
            geometryStarted,
            geometryPid,
            geometryLogPath,
            geometryServerStatus,
            geometryPort: geometryChosenPort,
          };
          out.summaryMarkdown = formatSummaryMarkdown(out);
          return out;
        }
      }

      const rr = await step('run_full_loop', async () => {
        const args = ['-m', 'asf.full_loop', '--root', repoAbs];
        if (geometryArtifacts) args.push('--geometry');
        return run(venvPython, args, { cwd: repoAbs, env, timeoutMs });
      });

      if (!rr.ok) {
        return fail(`asf.full_loop failed (exit=${rr.status})${rr.error ? `: ${rr.error}` : ''}`, {
          stdout: rr.stdout,
          stderr: rr.stderr,
          tests,
          repoDir: repoAbs,
          repoCloned,
          venvDir,
          venvPython,
          install,
          geometryUrl,
          geometryStarted,
          geometryPid,
          geometryLogPath,
          geometryServerStatus,
          geometryPort: geometryChosenPort,
        });
      }

      const header = parseJsonFromStdout(rr.stdout);
      const runId = header?.run_id || '';
      const summaryRel = header?.summary_path || '';
      const summaryAbs = summaryRel ? path.resolve(repoAbs, summaryRel) : '';

      if (!summaryAbs || !fs.existsSync(summaryAbs)) {
        return fail(`Could not locate summary.json (reported: ${summaryRel || '(none)'})`, {
          runId,
          stdout: rr.stdout,
          stderr: rr.stderr,
          tests,
          repoDir: repoAbs,
          repoCloned,
          venvDir,
          venvPython,
          install,
          geometryUrl,
          geometryStarted,
          geometryPid,
          geometryLogPath,
          geometryServerStatus,
          geometryPort: geometryChosenPort,
        });
      }

      const summaryRaw = fs.readFileSync(summaryAbs, 'utf8');
      const summary = JSON.parse(summaryRaw);
      const decision = summary.decision || {};

      const out = {
        success: true,
        phase: 'done',
        startedAt,
        endedAt: nowISO(),
        durationMs: Date.now() - new Date(startedAt).getTime(),
        steps,
        runId: summary.run_id || runId,
        summaryPath: summaryAbs,
        repoDir: repoAbs,
        repoCloned,
        venvDir,
        venvPython,
        install,
        geometryUrl,
        geometryStarted,
        geometryPid,
        geometryLogPath,
        geometryServerStatus,
        geometryPort: geometryChosenPort,
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
      out.summaryMarkdown = formatSummaryMarkdown(out);
      return out;
    } catch (error) {
      return {
        success: false,
        phase,
        startedAt,
        endedAt: nowISO(),
        durationMs: Date.now() - new Date(startedAt).getTime(),
        steps,
        error: error?.message || String(error),
      };
    }
  }
}

export default new AsfInlineRun();
