import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const APP_PATH = process.env.APP_PATH || path.join(__dirname, '../../..');

class EmergenceDetect {
  constructor() { this.name = 'emergence-detect'; }

  ECOSYSTEM_CORE = [
    'neuralforge', 'triadix-governance', 'triadix-ledger', 'tessera-neural-sidecar',
    'chemiframe', 'ice-crawler', 'plugin-rehydration', 'ecosystem-telemetry-hub',
    'aetherscop-afm', 'improve', 'system-control', 'agnt-connect',
    'lssao-toolkit', 'fractal-swarm', 'asf-runtime-loop-tools',
    'coding-telemetry-feedback-net', 'open-url-toolkit', 'atlas-cloud',
    'operation-timer', 'chat-actions-strip'
  ];

  async execute(params, inputData, workflowEngine) {
    try {
      const depth = params.analysis_depth || 'deep';
      const includeRecs = params.include_recommendations !== false;

      const token = process.env.AGNT_AUTH_TOKEN;
      const headers = { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' };
      const API_BASE = 'http://localhost:3333/api';

      async function apiGet(ep) {
        const r = await fetch(API_BASE + ep, { headers });
        return r.json();
      }

      // Get plugins and tools
      const installedResp = await apiGet('/plugins/installed');
      const toolsResp = await apiGet('/plugins/tools');
      const installed = installedResp.plugins || [];
      const allTools = toolsResp.tools || [];

      // Get dev folders
      const devBasePath = path.join(APP_PATH, 'backend', 'plugins', 'dev');
      const devFolders = new Set();
      try {
        const entries = fs.readdirSync(devBasePath, { withFileTypes: true });
        for (const e of entries) if (e.isDirectory()) devFolders.add(e.name);
      } catch(e) {}

      const signals = [];
      const recommendations = [];

      // === SIGNAL 1: Tool type prefix clustering ===
      // Detect tools from same plugin family that share prefixes
      const prefixClusters = {};
      for (const tool of allTools) {
        const prefix = tool.type.split('_')[0].split('-')[0];
        if (!prefixClusters[prefix]) prefixClusters[prefix] = [];
        prefixClusters[prefix].push(tool.type);
      }
      const strongClusters = Object.entries(prefixClusters).filter(([_, types]) => types.length >= 5);
      if (strongClusters.length > 0) {
        signals.push({
          type: 'tool_family_density',
          severity: 'info',
          description: strongClusters.length + ' dense tool families detected (5+ tools per prefix)',
          families: strongClusters.map(([p, t]) => ({ prefix: p, count: t.length }))
        });
      }

      // === SIGNAL 2: Core plugin connectivity ===
      const corePlugins = installed.filter(p => this.ECOSYSTEM_CORE.includes(p.name));
      const coreEnabled = corePlugins.filter(p => p.enabled);
      const coreOrphaned = corePlugins.filter(p => !devFolders.has(p.name));
      const coreDisabled = corePlugins.filter(p => !p.enabled);

      if (coreOrphaned.length > 0) {
        signals.push({
          type: 'core_orphaned',
          severity: coreOrphaned.length > 5 ? 'critical' : 'high',
          description: coreOrphaned.length + ' core ecosystem plugins have no dev source backup',
          orphaned: coreOrphaned.map(p => p.name)
        });
        if (includeRecs) {
          recommendations.push({
            type: 'backup_critical',
            priority: 'critical',
            description: 'Back up core plugin source to cold storage immediately',
            plugins: coreOrphaned.map(p => p.name)
          });
        }
      }

      if (coreDisabled.length > 0) {
        signals.push({
          type: 'core_disabled',
          severity: coreDisabled.length > 3 ? 'high' : 'medium',
          description: coreDisabled.length + ' core ecosystem plugins are disabled',
          disabled: coreDisabled.map(p => p.name)
        });
      }

      // === SIGNAL 3: Cross-plugin composition chains ===
      const coreToolTypes = new Set();
      for (const p of corePlugins) {
        for (const t of (p.tools || [])) coreToolTypes.add(t.type);
      }

      const chains = [];
      // NeuralForge → Tessera chain
      const hasNF = coreToolTypes.has('neuralforge_evolve') || coreToolTypes.has('neuralforge_analyze');
      const hasTessera = coreToolTypes.has('tessera-analyze') || coreToolTypes.has('tessera-trust');
      if (hasNF && hasTessera) {
        chains.push('NeuralForge Evolution -> Tessera Trust: neural anomaly patterns can feed trust layer validation');
      }
      // Tessera → Triadix chain
      const hasTriadix = coreToolTypes.has('triadix-governance') || coreToolTypes.has('gov-propose');
      if (hasTessera && hasTriadix) {
        chains.push('Tessera Trust -> Triadix Governance: agent trust scores could inform DAO governance decisions');
      }
      // Plugin-Rehydration → Ecosystem chain
      const hasRehyd = coreToolTypes.has('plugin-rehydration');
      const hasEcosystem = coreToolTypes.has('ecosystem-status') || coreToolTypes.has('emergence-detect');
      if (hasRehyd && hasEcosystem) {
        chains.push('Rehydration -> Ecosystem: plugin capability maps power emergence detection');
      }
      // NeuralForge → Ecosystem chain
      if (hasNF && hasEcosystem) {
        chains.push('NeuralForge -> Ecosystem: self-improvement telemetry feeds ecosystem health scoring');
      }

      if (chains.length > 0) {
        signals.push({
          type: 'composition_chain',
          severity: 'info',
          description: chains.length + ' cross-plugin composition chains detected',
          chains
        });
        if (includeRecs && chains.length >= 3) {
          recommendations.push({
            type: 'integration',
            priority: 'medium',
            description: 'Build explicit workflow bridge nodes that compose these plugin chains for one-click operations',
            chains
          });
        }
      }

      // === SIGNAL 4: Capability gap analysis ===
      const allDescText = allTools.map(t => (t.description || '') + ' ' + (t.title || '')).join(' ').toLowerCase();
      const expectedCapabilities = {
        'logging': ['log', 'history', 'audit', 'record'],
        'monitoring': ['monitor', 'health', 'status', 'metric'],
        'alerting': ['alert', 'notify', 'warn', 'alarm'],
        'testing': ['test', 'validate', 'verify', 'assert'],
        'documentation': ['document', 'report', 'readme', 'spec'],
        'scheduling': ['schedule', 'timer', 'cron', 'interval']
      };

      const gaps = [];
      for (const [cap, keywords] of Object.entries(expectedCapabilities)) {
        const found = keywords.some(kw => allDescText.includes(kw));
        if (!found) gaps.push(cap);
      }

      if (gaps.length > 0) {
        signals.push({
          type: 'capability_gap',
          severity: gaps.length > 3 ? 'high' : 'medium',
          description: gaps.length + ' expected ecosystem capabilities may be missing',
          missing_capabilities: gaps
        });
        if (includeRecs) {
          recommendations.push({
            type: 'new_plugin',
            priority: gaps.length > 3 ? 'high' : 'medium',
            description: 'Build plugins for missing capabilities: ' + gaps.join(', '),
            suggestion: 'Start with: ' + gaps.slice(0, 2).join(', ')
          });
        }
      }

      // === SIGNAL 5: Redundancy detection ===
      // Find plugins with overlapping tool categories
      const pluginCategories = {};
      for (const tool of allTools) {
        const plugin = tool.plugin;
        if (!pluginCategories[plugin]) pluginCategories[plugin] = new Set();
        pluginCategories[plugin].add(tool.category);
      }
      // Check if multiple plugins share the exact same category set
      const categorySigs = {};
      for (const [plugin, cats] of Object.entries(pluginCategories)) {
        const sig = [...cats].sort().join(',');
        if (!categorySigs[sig]) categorySigs[sig] = [];
        categorySigs[sig].push(plugin);
      }
      const redundant = Object.values(categorySigs).filter(plugins => plugins.length > 3);
      if (redundant.length > 0) {
        signals.push({
          type: 'category_redundancy',
          severity: 'low',
          description: redundant.length + ' category overlap groups detected (3+ plugins sharing same categories)',
          groups: redundant
        });
      }

      // === EMERGENCE SCORE ===
      const emergenceScore = this._calcEmergenceScore(signals, corePlugins.length, allTools.length, chains.length);

      // === BUILD REPORT ===
      let md = '# \uD83D\uDD2E Emergence Detection Report\n\n';
      md += '> Analysis depth: **' + depth + '** | ' + new Date().toISOString() + '\n\n';

      md += '## \uD83C\uDF0F Emergence Score: ' + emergenceScore + '/100\n\n';
      md += this._renderScoreBar(emergenceScore) + '\n\n';

      md += '### Score Components\n\n';
      md += '| Component | Status |\n|-----------|--------|\n';
      md += '| Cross-plugin chains | ' + (chains.length > 0 ? '\u2705 ' + chains.length + ' found' : '\u26A0\uFE0F None detected') + ' |\n';
      md += '| Capability coverage | ' + (gaps.length < 3 ? '\u2705 Good' : '\u26A0\uFE0F ' + gaps.length + ' gaps') + ' |\n';
      md += '| Core plugin health | ' + (coreOrphaned.length === 0 ? '\u2705 All backed up' : '\u26A0\uFE0F ' + coreOrphaned.length + ' orphaned') + ' |\n';
      md += '| Tool ecosystem density | ' + (allTools.length > 50 ? '\u2705 Rich (' + allTools.length + ' tools)' : '\uD83D\uDEE1 ' + allTools.length + ' tools') + ' |\n';
      md += '| Active core plugins | ' + (coreEnabled.length > corePlugins.length * 0.7 ? '\u2705 Healthy' : '\uD83D\uDEE1 Degraded') + ' (' + coreEnabled.length + '/' + corePlugins.length + ')\n\n';

      md += '## \uD83D\uDCFE Signals (' + signals.length + ')\n\n';
      for (const s of signals) {
        const icon = s.severity === 'critical' ? '\uD83D\uDD34' : s.severity === 'high' ? '\uD83D\uDFE0' : s.severity === 'medium' ? '\uD83D\uDFE1' : '\uD83D\uDD35';
        md += '### ' + icon + ' ' + s.type + '\n\n';
        md += '**Severity:** ' + s.severity + '\n\n';
        md += s.description + '\n\n';
        if (s.chains) {
          for (const c of s.chains) md += '- ' + c + '\n';
          md += '\n';
        }
        if (s.missing_capabilities) {
          md += '**Missing:** ' + s.missing_capabilities.join(', ') + '\n\n';
        }
        if (s.orphaned) {
          md += '**Orphaned:** ' + s.orphaned.join(', ') + '\n\n';
        }
      }

      if (includeRecs && recommendations.length > 0) {
        md += '## \uD83D\uDCA1 Recommendations\n\n';
        const sorted = recommendations.sort((a, b) => {
          const p = { critical: 0, high: 1, medium: 2, low: 3 };
          return (p[a.priority] || 4) - (p[b.priority] || 4);
        });
        for (const r of sorted) {
          const icon = r.priority === 'critical' ? '\uD83D\uDD34' : r.priority === 'high' ? '\uD83D\uDFE0' : r.priority === 'medium' ? '\uD83D\uDFE1' : '\uD83D\uDD35';
          md += '### ' + icon + ' [' + r.priority.toUpperCase() + '] ' + r.type + '\n\n';
          md += r.description + '\n\n';
          if (r.suggestion) md += '**Suggestion:** ' + r.suggestion + '\n\n';
          if (r.plugins) md += '**Plugins:** ' + r.plugins.join(', ') + '\n\n';
        }
      }

      md += '\n---\n\n';
      md += '*Emergence detection v1.0.0 — Ecosystem Telemetry Hub*';

      return { report: md, emergence_signals: signals, recommendations };
    } catch (error) {
      console.error('[' + this.name + '] Error:', error);
      return { error: error.message };
    }
  }

  _calcEmergenceScore(signals, coreCount, toolCount, chainCount) {
    let score = 30;
    score += Math.min(20, coreCount * 2);
    score += Math.min(20, toolCount / 5);
    score += chainCount * 10;
    score -= signals.filter(s => s.severity === 'critical').length * 15;
    score -= signals.filter(s => s.type === 'core_orphaned').length * 10;
    score += signals.filter(s => s.type === 'composition_chain').length * 5;
    score -= signals.filter(s => s.type === 'capability_gap').length * 3;
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  _renderScoreBar(score) {
    const filled = Math.round(score / 5);
    const empty = 20 - filled;
    return '\u2588'.repeat(filled) + '\u2591'.repeat(empty) + ' ' + score + '%';
  }
}

export default new EmergenceDetect();
