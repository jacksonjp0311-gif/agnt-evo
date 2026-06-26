import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const APP_PATH = process.env.APP_PATH || path.join(__dirname, '../../..');

class ColdStorageSync {
  constructor() { this.name = 'cold-storage-sync'; }

  COLD_STORAGE_REPO = 'AGNT-PLUGINS';
  GITHUB_OWNER = 'jacksonjp0311-gif';
  COLD_STORAGE_SRC = 'src';

  TRACKED_PLUGINS = [
    'neuralforge', 'triadix-governance', 'triadix-ledger', 'tessera-neural-sidecar',
    'chemiframe', 'ice-crawler', 'plugin-rehydration', 'ecosystem-telemetry-hub',
    'aetherscop-afm', 'improve', 'system-control', 'agnt-connect',
    'lssao-toolkit', 'fractal-swarm', 'asf-runtime-loop-tools',
    'coding-telemetry-feedback-net', 'open-url-toolkit', 'atlas-cloud',
    'operation-timer', 'chat-actions-strip'
  ];

  async execute(params, inputData, workflowEngine) {
    try {
      const mode = params.mode || 'status';
      const token = process.env.AGNT_AUTH_TOKEN;
      const headers = { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' };
      const API_BASE = 'http://localhost:3333/api';

      async function apiGet(ep) {
        const r = await fetch(API_BASE + ep, { headers });
        return r.json();
      }

      const installedResp = await apiGet('/plugins/installed');
      const installed = installedResp.plugins || [];

      // Check local dev folderBasePath = path.join(APP_PATH, 'backend', 'plugins', 'dev');
      const devFolders = new Set();
      try {
        const entries = fs.readdirSync(devBasePath, { withFileTypes: true });
        for (const e of entries) {
          if (e.isDirectory()) devFolders.add(e.name);
        }
      } catch (e) { /* dev folder may not exist */ }

      // Check GitHub cold storage directories via API
      const coldStorageUrl = 'https://api.github.com/repos/' + this.GITHUB_OWNER + '/' + this.COLD_STORAGE_REPO + '/contents/' + this.COLD_STORAGE_SRC;
      let coldStorageFolders = new Set();
      try {
        const ghResp = await fetch(coldStorageUrl, {
          headers: { 'Accept': 'application/vnd.github.v3+json' }
        });
        if (ghResp.ok) {
          const ghData = await ghResp.json();
          if (Array.isArray(ghData)) {
            for (const item of ghData) {
              if (item.type === 'dir') coldStorageFolders.add(item.name);
            }
          }
        }
      } catch (e) { /* GitHub API may be rate-limited */ }

      // Cross-reference
      const synced = [];
      const unsynced = [];

      for (const pluginName of this.TRACKED_PLUGINS) {
        const isInstalled = installed.find(p => p.name === pluginName);
        const inDev = devFolders.has(pluginName);
        const inCold = coldStorageFolders.has(pluginName);

        if (inCold || inDev) {
          synced.push({
            name: pluginName,
            version: isInstalled ? isInstalled.version : '?',
            installed: !!isInstalled,
            inDev,
            inColdStorage: inCold,
            status: inCold ? 'backed_up' : 'dev_only'
          });
        } else {
          unsynced.push({
            name: pluginName,
            version: isInstalled ? isInstalled.version : '?',
            installed: !!isInstalled,
            severity: isInstalled ? 'critical' : 'medium'
          });
        }
      }

      // Build report
      const total = this.TRACKED_PLUGINS.length;
      const backedUp = synced.filter(s => s.inColdStorage).length;
      const coverage = total > 0 ? Math.round((backedUp / total) * 100) : 0;

      const lines = [];
      lines.push('# :snowflake: Cold Storage Sync Report');
      lines.push('');
      lines.push('> Mode: **' + mode + '** | ' + new Date().toISOString());
      lines.push('');
      lines.push('## :bar_chart: Summary');
      lines.push('');
      lines.push('| Metric | Count |');
      lines.push('|--------|-------|');
      lines.push('| Tracked Plugins | ' + total + ' |');
      lines.push('| In Dev Folder | ' + synced.filter(s => s.inDev).length + ' |');
      lines.push('| In Cold Storage | ' + backedUp + ' |');
      lines.push('| Dev Only (not in GitHub) | ' + synced.filter(s => s.status === 'dev_only').length + ' |');
      lines.push('| Not Found Anywhere | ' + unsynced.length + ' |');
      lines.push('| **Backup Coverage** | **' + coverage + '%** |');
      lines.push('');
      lines.push('## :white_check_mark: Synced Plugins');
      lines.push('');
      lines.push('| Plugin | Version | In Dev | In Cold Storage | Status |');
      lines.push('|--------|---------|--------|-----------------|--------|');
      for (const s of synced) {
        const devIcon = s.inDev ? ':white_check_mark:' : ':x:';
        const coldIcon = s.inColdStorage ? ':white_check_mark:' : ':x:';
        lines.push('| **' + s.name + '** | v' + s.version + ' | ' + devIcon + ' | ' + coldIcon + ' | ' + s.status + ' |');
      }

      if (unsynced.length > 0) {
        lines.push('');
        lines.push('## :warning: Missing from Cold Storage');
        lines.push('');
        for (const u of unsynced) {
          lines.push('- **' + u.name + '** (v' + u.version + ') -- ' + u.severity + ' priority');
        }
      }

      if (mode === 'dry-run' || mode === 'full') {
        lines.push('');
        lines.push('## :arrows_counterclockwise: Actions Needed');
        lines.push('');
        for (const u of unsynced) {
          lines.push('- Backup `' + u.name + '` from dev/ to AGNT-PLUGINS/src/');
        }
      }

      lines.push('');
      lines.push('---');
      lines.push('');
      lines.push('*Cold Storage Sync v1.0.0 -- Ecosystem Telemetry Hub*');

      const report = lines.join('\n');

      return { report, synced, unsynced, drifted: [], coverage };
    } catch (error) {
      console.error('[' + this.name + '] Error:', error);
      return { error: error.message };
    }
  }
}

export default new ColdStorageSync();
