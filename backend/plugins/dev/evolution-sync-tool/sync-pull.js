import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OWNER = process.env.GITHUB_OWNER || 'jacksonjp0311-gif';
const REPO = 'AGNT-PLUGINS';

class SyncPull {
  constructor() { this.name = 'sync-pull'; }

  async execute(params, inputData, workflowEngine) {
    try {
      const baseDir = path.resolve(__dirname, '..', '..', '..', '..', '..');
      const pluginsParam = params.plugins || 'all';
      const dryRun = params.dry_run || false;
      const devPath = path.join(baseDir, 'backend', 'plugins', 'dev');
      const pulled = [];
      const errors = [];

      const apiUrl = 'https://api.github.com/repos/' + OWNER + '/' + REPO + '/contents/src';
      const resp = await fetch(apiUrl, { headers: { Accept: 'application/vnd.github.v3+json' } });
      if (!resp.ok) return { error: 'GitHub API error: ' + resp.status };
      const contents = await resp.json();
      const coldDirs = Array.isArray(contents) ? contents.filter(function(c) { return c.type === 'dir'; }).map(function(c) { return c.name; }) : [];

      let toPull;
      if (pluginsParam === 'all') { toPull = coldDirs; }
      else {
        const wanted = pluginsParam.split(',').map(function(p) { return p.trim(); });
        toPull = coldDirs.filter(function(p) { return wanted.indexOf(p) >= 0; });
      }

      for (const pluginName of toPull) {
        try {
          if (dryRun) { pulled.push({ name: pluginName, status: 'dry_run' }); continue; }
          const targetPath = path.join(devPath, pluginName);
          const dlResult = await this._downloadDir(pluginName, targetPath);
          if (dlResult.success) { pulled.push({ name: pluginName, files: dlResult.count }); }
          else { errors.push({ name: pluginName, error: dlResult.error }); }
        } catch(e) { errors.push({ name: pluginName, error: e.message }); }
      }

      const rpt = [];
      rpt.push('# Sync Pull Report');
      rpt.push('');
      const modeStr = dryRun ? 'DRY RUN' : 'LIVE';
      rpt.push('Mode: ' + modeStr);
      rpt.push('Total in cold storage: ' + coldDirs.length);
      rpt.push('Pulled: ' + pulled.length);
      rpt.push('Errors: ' + errors.length);
      rpt.push('');
      for (const p of pulled) {
        const sf = p.files ? ': ' + p.files + ' files' : ' (dry run)';
        rpt.push('- ' + p.name + sf);
      }
      for (const e of errors) { rpt.push('- ERROR ' + e.name + ': ' + e.error); }
      return { report: rpt.join('\n'), pulled: pulled, errors: errors, skipped: [] };
    } catch(e) {
      console.error('[' + this.name + '] Error:', e);
      return { error: e.message };
    }
  }

  async _downloadDir(pluginName, targetPath) {
    const url = 'https://api.github.com/repos/' + OWNER + '/' + REPO + '/contents/src/' + pluginName;
    const resp = await fetch(url, { headers: { Accept: 'application/vnd.github.v3+json' } });
    if (!resp.ok) return { success: false, error: 'HTTP ' + resp.status };
    const data = await resp.json();
    if (!Array.isArray(data)) return { success: false, error: 'Not dir' };
    fs.mkdirSync(targetPath, { recursive: true });
    let count = 0;
    for (const item of data) {
      if (item.type === 'file') {
        const r = await fetch(item.download_url);
        if (r.ok) {
          const buf = Buffer.from(await r.arrayBuffer());
          const localFile = path.join(targetPath, item.name);
          let localSize = 0;
          try { localSize = fs.statSync(localFile).size; } catch(e) {}
          if (localSize !== buf.length) {
            fs.writeFileSync(localFile, buf);
            count++;
          }
        }
      } else if (item.type === 'dir') {
        const sub = await this._downloadDir(pluginName + '/' + item.name, path.join(targetPath, item.name));
        count += (sub.count || 0);
      }
    }
    return { success: true, count: count };
  }
}

export default new SyncPull();