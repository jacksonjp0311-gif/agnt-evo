import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SyncPush {
  constructor() { this.name = 'sync-push'; }

  async execute(params, inputData, workflowEngine) {
    try {
      const baseDir = path.resolve(__dirname, '..', '..', '..', '..', '..');
      const devPath = path.join(baseDir, 'backend', 'plugins', 'dev');
      const repoPath = path.join(baseDir, 'AGNT-PLUGINS');
      const message = params.message || 'chore: sync evolution updates';
      const requestedPlugins = (params.plugins || 'unsynced').split(',').map(function(p) { return p.trim(); });
      const pushed = [];

      let toPush;
      if (requestedPlugins.indexOf('unsynced') >= 0) {
        const repoSrc = path.join(repoPath, 'src');
        const inRepo = new Set();
        try { for (const d of fs.readdirSync(repoSrc, { withFileTypes: true })) { if (d.isDirectory()) inRepo.add(d.name); } } catch(e) {}
        const inDev = fs.readdirSync(devPath, { withFileTypes: true }).filter(function(d) { return d.isDirectory(); }).map(function(d) { return d.name; });
        toPush = inDev.filter(function(p) { return !inRepo.has(p) && p.charAt(0) !== '_' && p.charAt(0) !== '.'; });
      } else if (requestedPlugins.indexOf('all') >= 0) {
        toPush = fs.readdirSync(devPath, { withFileTypes: true }).filter(function(d) { return d.isDirectory() && d.name.charAt(0) !== '_' && d.name.charAt(0) !== '.'; }).map(function(d) { return d.name; });
      } else {
        toPush = requestedPlugins.filter(function(p) { try { return fs.statSync(path.join(devPath, p)).isDirectory(); } catch(e) { return false; } });
      }

      if (toPush.length === 0) { return { report: 'No plugins to push. Already synced.', pushed: [] }; }
      if (!fs.existsSync(repoPath)) { return { error: 'Repo not found: ' + repoPath }; }

      const ts = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
      const pushMsg = message + ' [' + ts + ']';

      const scriptLines = [];
      scriptLines.push('@echo off');
      scriptLines.push('echo Syncing...');
      scriptLines.push('cd /d "' + repoPath + '"');
      scriptLines.push('git pull origin main');
      for (const pn of toPush) {
        scriptLines.push('xcopy /s /y "' + devPath + '\\' + pn + '\\*.*" "src\\' + pn + '\\"');
      }
      scriptLines.push('git add src/');
      scriptLines.push('git commit -m "' + pushMsg + '"');
      scriptLines.push('git push origin main');
      scriptLines.push('echo Done.');
      const scriptPath = path.join(baseDir, 'scripts', 'sync-plugins.bat');
      try { fs.mkdirSync(path.dirname(scriptPath), { recursive: true }); } catch(e) {}
      fs.writeFileSync(scriptPath, scriptLines.join('\n'));

      const rpt = [];
      rpt.push('# Sync Push Report');
      rpt.push('');
      rpt.push('Plugins to push: ' + toPush.length);
      rpt.push('');
      for (const p of toPush) { rpt.push('- ' + p); pushed.push(p); }
      rpt.push('');
      rpt.push('Run: ' + scriptPath);
      return { report: rpt.join('\n'), pushed: pushed, skipped: [] };
    } catch(e) {
      console.error('[' + this.name + '] Error:', e);
      return { error: e.message };
    }
  }
}

export default new SyncPush();
