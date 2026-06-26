import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const APP_PATH = process.env.APP_PATH || path.join(__dirname, '../../..');

class EcosystemStatus {
  constructor() { this.name = 'ecosystem-status'; }

  ECOSYSTEM_CORE = [
    'neuralforge', 'triadix-governance', 'triadix-ledger', 'tessera-neural-sidecar',
    'chemiframe', 'ice-crawler', 'plugin-rehydration', 'ecosystem-telemetry-hub',
    'aetherscop-afm', 'improve', 'system-control', 'agnt-connect',
    'lssao-toolkit', 'fractal-swarm', 'asf-runtime-loop-tools',
    'coding-telemetry-feedback-net', 'open-url-toolkit', 'atlas-cloud',
    'operation-timer', 'chat-actions-strip'
  ];

  CATEGORIES = {
    'neuralforge': 'ai-ml',
    'triadix-governance': 'governance',
    'triadix-ledger': 'governance',
    'tessera-neural-sidecar': 'ai-ml',
    'chemiframe': 'science',
    'ice-crawler': 'infrastructure',
    'plugin-rehydration': 'infrastructure',
    'ecosystem-telemetry-hub': 'infrastructure',
    'aetherscop-afm': 'analysis',
    'improve': 'infrastructure',
    'system-control': 'infrastructure',
    'agnt-connect': 'infrastructure',
    'lssao-toolkit': 'governance',
    'fractal-swarm': 'ai-ml',
    'asf-runtime-loop-tools': 'governance',
    'coding-telemetry-feedback-net': 'telemetry',
    'open-url-toolkit': 'ux',
    'atlas-cloud': 'infrastructure',
    'operation-timer': 'ux',
    'chat-actions-strip': 'ux'
  };

  async execute(params, inputData, workflowEngine) {
    try {
      const includeDetails = params.include_details || false;
      const filter = params.filter || 'all';
      const token = process.env.AGNT_AUTH_TOKEN;
      const headers = { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' };
      const API_BASE = 'http://localhost:3333/api';

      async function apiGet(ep) {
        const r = await fetch(API_BASE + ep, { headers });
        return r.json();
      }

      const installedResp = await apiGet('/plugins/installed');
      if (!installedResp.success) return { error: 'Failed to fetch installed plugins' };
      const installedPlugins = installedResp.plugins || [];

      const devBasePath = path.join(APP_PATH, 'backend', 'plugins', 'dev');
      const devFolders = new Set();
      try {
        const entries = fs.readdirSync(devBasePath, { withFileTypes: true });
        for (const e of entries) {
          if (e.isDirectory()) devFolders.add(e.name);
        }
      } catch (e) {}

      const toolsResp = await apiGet('/plugins/tools');
      const allTools = toolsResp.tools || [];

      const pluginMatrix = installedPlugins.map(p => ({
        name: p.name,
        displayName: p.displayName,
        version: p.version,
        enabled: p.enabled,
        tool_count: p.tools ? p.tools.length : 0,
        has_dev_source: devFolders.has(p.name),
        category: this.CATEGORIES[p.name] || 'utility',
        author: p.author || '',
        description: (p.description || '').substring(0, 100)
      }));

      let filtered;
      switch (filter) {
        case 'local':
          filtered = pluginMatrix.filter(p => this.ECOSYSTEM_CORE.includes(p.name));
          break;
        case 'built-in':
          filtered = pluginMatrix.filter(p => !this.ECOSYSTEM_CORE.includes(p.name));
          break;
        case 'orphaned':
          filtered = pluginMatrix.filter(p => !p.has_dev_source);
          break;
        case 'ecosystem':
          filtered = pluginMatrix.filter(p => this.ECOSYSTEM_CORE.includes(p.name) && p.name !== 'plugin-rehydration' && p.name !== 'ecosystem-telemetry-hub');
          break;
        default:
          filtered = pluginMatrix;
      }

      const categoryCounts = {};
      for (const p of filtered) {
        categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
      }

      const summary = {
        total_plugins: filtered.length,
        total_tools: allTools.length,
        enabled_count: filtered.filter(p => p.enabled).length,
        dev_source_count: filtered.filter(p => p.has_dev_source).length,
        orphaned_count: filtered.filter(p => !p.has_dev_source).length,
        categories: categoryCounts,
        health_score: this._calcHealthScore(filtered)
      };

      const lines = [];
      lines.push('# AGNT Ecosystem Status Report');
      lines.push('');
      lines.push('> Generated: ' + new Date().toISOString());
      lines.push('');
      lines.push('## Summary');
      lines.push('');
      lines.push('| Metric | Value |');
      lines.push('|--------|-------|');
      lines.push('| Total Plugins | ' + summary.total_plugins + ' |');
      lines.push('| Enabled | ' + summary.enabled_count + ' |');
      lines.push('| Total Tools | ' + summary.total_tools + ' |');
      lines.push('| Have Dev Source | ' + summary.dev_source_count + ' |');
      lines.push('| Orphaned | ' + summary.orphaned_count + ' |');
      lines.push('| Ecosystem Health | ' + summary.health_score + '% |');
      lines.push('');
      lines.push('### Categories');
      lines.push('');
      lines.push('| Category | Count |');
      lines.push('|----------|-------|');
      const sortedCats = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);
      for (const [cat, count] of sortedCats) {
        lines.push('| ' + cat + ' | ' + count + ' |');
      }

      lines.push('');
      lines.push('## Ecosystem Core');
      lines.push('');
      const core = filtered.filter(p => this.ECOSYSTEM_CORE.includes(p.name));
      for (const p of core) {
        const si = p.enabled ? '[ON]' : '[OFF]';
        const src = p.has_dev_source ? '[DEV]' : '[ORPHAN]';
        lines.push(si + ' **' + (p.displayName || p.name) + '** v' + p.version + ' ' + src);
        lines.push('  ' + p.description);
        lines.push('');
      }

      if (filter === 'all') {
        lines.push('');
        lines.push('## All Plugins');
        lines.push('');
        for (const p of filtered) {
          const si = p.enabled ? '[ON]' : '[OFF]';
          const src = p.has_dev_source ? '[DEV]' : '[ORPHAN]';
          lines.push(si + ' **' + (p.displayName || p.name) + '** (' + p.tool_count + ' tools) v' + p.version + ' ' + src);
        }
      }

      const report = lines.join('\n');
      return { report, summary, plugin_matrix: filtered };
    } catch (error) {
      console.error('[' + this.name + '] Error:', error);
      return { error: error.message };
    }
  }

  _calcHealthScore(plugins) {
    if (plugins.length === 0) return 0;
    let score = 100;
    const orphanedRatio = plugins.filter(p => !p.has_dev_source).length / plugins.length;
    score -= orphanedRatio * 20;
    const disabledRatio = plugins.filter(p => !p.enabled).length / plugins.length;
    score -= disabledRatio * 10;
    return Math.max(0, Math.round(score));
  }
}

export default new EcosystemStatus();
