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

class AsfGeometryServer {
  constructor() {
    this.name = 'asf-geometry-server';
  }

  async execute(params, inputData, workflowEngine) {
    const action = String(params?.action || 'status');
    const timeoutMs = asInt(params?.timeoutSeconds, 120, 5, 1800) * 1000;

    const geometryHost = String(params?.geometryHost || '127.0.0.1');
    let geometryPort = Number(params?.geometryPort ?? 8765);
    if (!Number.isFinite(geometryPort)) geometryPort = 8765;
    geometryPort = Math.max(0, Math.min(65535, Math.trunc(geometryPort)));
    const autoPortOnConflict = asBool(params?.autoPortOnConflict ?? true);

    const bootstrapPython = String(params?.pythonExe || 'python');

    const userId = String(workflowEngine?.userId ?? 'default');
    const pluginDataRoot = path.join(getUserDataPath(), 'plugin-data', 'asf-runtime-loop-tools', userId);
    const pyRoot = path.join(pluginDataRoot, 'python');
    const venvDir = path.join(pyRoot, 'venv');
    const venvPython = getVenvPythonPath(venvDir);

    const geoDir = path.join(pluginDataRoot, 'geometry');
    ensureDir(geoDir);
    const metaPath = path.join(geoDir, 'geometry-server.json');
    const logPath = path.join(geoDir, 'geometry-server.log');

    const meta = safeReadJSON(metaPath);

    // STATUS
    if (action === 'status') {
      const geometryUrl = meta?.geometryUrl || '';
      const pid = meta?.pid || null;
      const running = geometryUrl ? (pid ? isProcessAlive(pid) : true) && (await isGeometryHealthy(geometryUrl)) : false;
      return {
        success: true,
        action,
        running,
        pid,
        geometryUrl,
        geometryLogPath: logPath,
        meta,
      };
    }

    // STOP
    if (action === 'stop') {
      if (meta?.pid && isProcessAlive(meta.pid)) {
        try {
          process.kill(meta.pid);
        } catch (e) {
          return { success: false, action, error: `Failed to stop pid ${meta.pid}: ${e?.message || String(e)}`, geometryLogPath: logPath, meta };
        }
      }
      safeWriteJSON(metaPath, { ...meta, stoppedAt: new Date().toISOString() });
      return { success: true, action, stopped: true, geometryLogPath: logPath, meta: safeReadJSON(metaPath) };
    }

    // START
    if (action === 'start') {
      const repoDir = String(params?.repoRoot || meta?.repoDir || '').trim();
      if (!repoDir || !fs.existsSync(repoDir)) {
        return { success: false, action, error: 'repoRoot is required (must point to ASF repo root).', geometryLogPath: logPath };
      }

      // Ensure venv exists
      if (!fs.existsSync(venvPython)) {
        ensureDir(venvDir);
        const vr = run(bootstrapPython, ['-m', 'venv', venvDir], { cwd: repoDir, env: process.env, timeoutMs });
        if (!vr.ok) {
          return { success: false, action, error: `Failed to create venv: ${vr.stderr || vr.error || ''}`, geometryLogPath: logPath };
        }
      }

      // If existing server healthy, reuse
      if (meta?.pid && meta?.geometryUrl) {
        if (isProcessAlive(meta.pid) && (await isGeometryHealthy(meta.geometryUrl))) {
          return {
            success: true,
            action,
            running: true,
            pid: meta.pid,
            geometryUrl: meta.geometryUrl,
            geometryLogPath: logPath,
            serverStatus: 'already_running',
          };
        }
      }

      // Choose port
      let chosenPort = geometryPort;
      if (chosenPort === 0) chosenPort = await getFreePort(geometryHost);
      else {
        const open = await isPortOpen(chosenPort, geometryHost);
        if (open && autoPortOnConflict) chosenPort = await getFreePort(geometryHost);
      }

      const geometryUrl = `http://${geometryHost}:${chosenPort}`;
      const pid = startDetached(
        venvPython,
        ['-m', 'asf.cli', 'geometry', 'serve', '--root', repoDir, '--host', geometryHost, '--port', String(chosenPort)],
        { cwd: repoDir, env: { ...process.env, PYTHONPATH: repoDir }, logFile: logPath }
      );

      safeWriteJSON(metaPath, { pid, geometryUrl, repoDir, startedAt: new Date().toISOString() });

      for (let i = 0; i < 40; i++) {
        if (await isGeometryHealthy(geometryUrl)) {
          return { success: true, action, running: true, pid, geometryUrl, geometryLogPath: logPath, serverStatus: 'started' };
        }
        await new Promise((r) => setTimeout(r, 250));
      }

      return { success: true, action, running: false, pid, geometryUrl, geometryLogPath: logPath, serverStatus: 'start_attempted_not_ready' };
    }

    return { success: false, action, error: `Unknown action: ${action}` };
  }
}

export default new AsfGeometryServer();
