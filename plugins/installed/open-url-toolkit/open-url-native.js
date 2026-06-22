import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

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

function normalizeUrl(raw, { allowFile = false } = {}) {
  const url = String(raw || '').trim();
  if (!url) throw new Error('url is required');

  const lower = url.toLowerCase();
  const ok =
    lower.startsWith('http://') ||
    lower.startsWith('https://') ||
    (allowFile && lower.startsWith('file:///'));

  if (!ok) {
    throw new Error(
      allowFile
        ? 'Unsupported URL scheme. Use http(s):// or file:///.'
        : 'Unsupported URL scheme. Use http(s)://.'
    );
  }

  // Hardening: avoid newlines (can mess with shells)
  if (url.includes('\n') || url.includes('\r')) throw new Error('Invalid url: contains newline characters');

  return url;
}

function getUserDataPath() {
  return process.env.USER_DATA_PATH || process.cwd();
}

function getRateLimitPath(userId) {
  return path.join(getUserDataPath(), 'plugin-data', 'open-url-toolkit', String(userId || 'default'), 'rate-limit.json');
}

function readRateLimitState(p) {
  try {
    if (!fs.existsSync(p)) return { launches: [] };
    const data = JSON.parse(fs.readFileSync(p, 'utf8'));
    if (!data || !Array.isArray(data.launches)) return { launches: [] };
    return data;
  } catch {
    return { launches: [] };
  }
}

function writeRateLimitState(p, state) {
  try {
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, JSON.stringify(state, null, 2));
  } catch {
    // ignore
  }
}

function enforceRateLimit({ userId, maxLaunches, windowSeconds, disableRateLimit }) {
  if (disableRateLimit) {
    return { allowed: true, cooldownRemainingMs: 0, countInWindow: 0 };
  }

  const windowMs = Math.max(1, windowSeconds) * 1000;
  const p = getRateLimitPath(userId);
  const state = readRateLimitState(p);

  const now = Date.now();
  const launches = state.launches.filter((t) => typeof t === 'number' && now - t <= windowMs);

  if (launches.length >= maxLaunches) {
    const oldest = Math.min(...launches);
    const cooldownRemainingMs = Math.max(0, windowMs - (now - oldest));
    writeRateLimitState(p, { launches });
    return { allowed: false, cooldownRemainingMs, countInWindow: launches.length };
  }

  launches.push(now);
  writeRateLimitState(p, { launches });
  return { allowed: true, cooldownRemainingMs: 0, countInWindow: launches.length };
}

function resolveWindowsBrowser(browser) {
  const b = String(browser || 'default').toLowerCase();
  if (b === 'default') return { mode: 'default' };

  const candidates = [];

  if (b === 'chrome') {
    candidates.push(
      'C:/Program Files/Google/Chrome/Application/chrome.exe',
      'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
      'chrome'
    );
  } else if (b === 'edge' || b === 'msedge') {
    candidates.push(
      'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
      'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
      'msedge'
    );
  } else if (b === 'firefox') {
    candidates.push(
      'C:/Program Files/Mozilla Firefox/firefox.exe',
      'C:/Program Files (x86)/Mozilla Firefox/firefox.exe',
      'firefox'
    );
  } else {
    return { mode: 'default' };
  }

  for (const c of candidates) {
    if (c.includes(':/')) {
      // filesystem path
      if (fs.existsSync(c)) return { mode: 'explicit', exe: c, browser: b };
    } else {
      // rely on PATH
      return { mode: 'explicit', exe: c, browser: b };
    }
  }

  return { mode: 'default' };
}

function buildOpenCommand(url, { browser, profileDirectory, newWindow } = {}) {
  const platform = process.platform;

  if (platform === 'win32') {
    const resolved = resolveWindowsBrowser(browser);

    if (resolved.mode === 'default') {
      // `start` is a cmd builtin; empty title arg avoids treating the URL as the title
      return { cmd: 'cmd', args: ['/c', 'start', '""', url], platform };
    }

    const args = [];

    // Browser-specific args
    if (resolved.browser === 'chrome' || resolved.browser === 'edge' || resolved.browser === 'msedge') {
      if (profileDirectory) args.push(`--profile-directory=${profileDirectory}`);
      if (newWindow) args.push('--new-window');
    }

    if (resolved.browser === 'firefox') {
      if (profileDirectory) args.push('-P', profileDirectory);
      if (newWindow) args.push('-new-window');
    }

    args.push(url);
    return { cmd: resolved.exe, args, platform };
  }

  if (platform === 'darwin') {
    // macOS: we can optionally prefer a specific app via `-a`, but keep simple
    return { cmd: 'open', args: [url], platform };
  }

  // Linux / others
  return { cmd: 'xdg-open', args: [url], platform };
}

class OpenUrlNative {
  constructor() {
    this.name = 'open-url-native';
  }

  async execute(params, inputData, workflowEngine) {
    try {
      const confirm = asBool(params?.confirm);
      const allowFile = asBool(params?.allowFile);
      const url = normalizeUrl(params?.url, { allowFile });

      // Safety gate for public marketplace
      if (!confirm) {
        return {
          success: false,
          launched: false,
          url,
          error: 'Refusing to open external browser without confirm=true.',
        };
      }

      // Rate limit defaults
      const maxLaunches = asInt(params?.maxLaunches, 3, 1, 50);
      const windowSeconds = asInt(params?.windowSeconds, 10, 1, 600);
      const disableRateLimit = asBool(params?.disableRateLimit);

      const userId = workflowEngine?.userId || 'default';
      const rl = enforceRateLimit({ userId, maxLaunches, windowSeconds, disableRateLimit });
      if (!rl.allowed) {
        return {
          success: false,
          launched: false,
          url,
          rateLimited: true,
          cooldownRemainingMs: rl.cooldownRemainingMs,
          countInWindow: rl.countInWindow,
          error: `Rate limit exceeded: max ${maxLaunches} opens per ${windowSeconds}s.`,
        };
      }

      const browser = String(params?.browser || 'default');
      const profileDirectory = String(params?.profileDirectory || '').trim() || null;
      const newWindow = asBool(params?.newWindow);

      const { cmd, args, platform } = buildOpenCommand(url, { browser, profileDirectory, newWindow });

      // Detached so we don't wait for the browser process.
      const child = spawn(cmd, args, {
        detached: true,
        stdio: 'ignore',
        windowsHide: true,
      });
      child.unref();

      return {
        success: true,
        launched: true,
        url,
        platform,
        command: cmd,
        args,
        pid: child.pid ?? null,
        rateLimited: false,
        cooldownRemainingMs: 0,
        countInWindow: rl.countInWindow,
        error: '',
      };
    } catch (error) {
      return { success: false, launched: false, error: error?.message || String(error) };
    }
  }
}

export default new OpenUrlNative();
