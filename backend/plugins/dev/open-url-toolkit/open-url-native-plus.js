import { spawn } from 'child_process';

function asBool(v) {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  if (typeof v === 'string') return ['true', '1', 'yes', 'on'].includes(v.trim().toLowerCase());
  return false;
}

function safeJsonParse(v) {
  if (v == null) return null;
  if (typeof v === 'object') return v;
  const s = String(v).trim();
  if (!s) return null;
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

function normalizeBaseUrl(raw) {
  const url = String(raw || '').trim();
  if (!url) throw new Error('baseUrl is required');
  const lower = url.toLowerCase();
  if (!lower.startsWith('http://') && !lower.startsWith('https://')) {
    throw new Error('baseUrl must start with http:// or https://');
  }
  if (url.includes('\n') || url.includes('\r')) throw new Error('Invalid baseUrl: contains newline characters');
  return url;
}

function buildUrl(baseUrl, queryObj) {
  const u = new URL(baseUrl);
  if (queryObj && typeof queryObj === 'object') {
    for (const [k, v] of Object.entries(queryObj)) {
      if (v === undefined || v === null) continue;
      if (Array.isArray(v)) {
        for (const item of v) u.searchParams.append(k, String(item));
      } else {
        u.searchParams.set(k, String(v));
      }
    }
  }
  return u.toString();
}

function buildOpenCommand(url) {
  const platform = process.platform;
  if (platform === 'win32') return { cmd: 'cmd', args: ['/c', 'start', '""', url], platform };
  if (platform === 'darwin') return { cmd: 'open', args: [url], platform };
  return { cmd: 'xdg-open', args: [url], platform };
}

class OpenUrlNativePlus {
  constructor() {
    this.name = 'open-url-native-plus';
  }

  async execute(params) {
    try {
      const confirm = asBool(params?.confirm);
      const baseUrl = normalizeBaseUrl(params?.baseUrl);
      const query = safeJsonParse(params?.queryJson) || params?.query || {};
      const url = buildUrl(baseUrl, query);

      if (!confirm) {
        return { success: false, launched: false, url, error: 'Refusing to open external browser without confirm=true.' };
      }

      const { cmd, args, platform } = buildOpenCommand(url);
      const child = spawn(cmd, args, { detached: true, stdio: 'ignore', windowsHide: true });
      child.unref();

      return { success: true, launched: true, url, platform, command: cmd, args, pid: child.pid ?? null, error: '' };
    } catch (error) {
      return { success: false, launched: false, error: error?.message || String(error) };
    }
  }
}

export default new OpenUrlNativePlus();
