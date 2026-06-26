import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const APP_PATH = process.env.APP_PATH || path.join(__dirname, '../../..');
const API_BASE = 'http://localhost:3333/api';

class PluginRehydration {
  constructor() {
    this.name = 'plugin-rehydration';
  }

  async execute(params, inputData, workflowEngine) {
    try {
      const mode = params.mode || 'full';
      const pluginName = params.plugin_name || null;
      const includeSource = params.include_source || false;
      const outputFormat = params.output_format || 'markdown';

      const token = process.env.AGNT_AUTH_TOKEN;
      const headers = {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      };

      async function apiGet(ep) {
        const r = await fetch(API_BASE + ep, { headers });
        return r.json();
      }

      // Step 1: Get all installed plugins
      const installedResp = await apiGet('/plugins/installed');
      if (!installedResp.success) {
        return { error: 'Failed to fetch installed plugins: ' + JSON.stringify(installedResp) };
      }
      const installedPlugins = installedResp.plugins || [];

      // Step 2: Get all available tools
      const toolsResp = await apiGet('/plugins/tools');
      const allTools = toolsResp.tools || [];

      // Step 3: Get dev folder listing
      const devBasePath = path.join(APP_PATH, 'backend', 'plugins', 'dev');
      const devFolders = new Set();
      try {
        const entries = fs.readdirSync(devBasePath, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory()) {
            devFolders.add(entry.name);
          }
        }
      } catch (e) {
        // dev folder may not exist or be accessible
      }

      // Step 4: Cross-reference and build plugin profiles
      const pluginProfiles = [];
      const orphaned = [];
      const inDev = [];

      for (const plugin of installedPlugins) {
        const hasSourceOnDisk = devFolders.has(plugin.name);
        const profile = {
          name: plugin.name,
          displayName: plugin.displayName,
          version: plugin.version,
          description: plugin.description,
          author: plugin.author,
          homepage: plugin.homepage,
          icon: plugin.icon,
          enabled: plugin.enabled,
          installedAt: plugin.installedAt,
          size: plugin.size,
          tools: plugin.tools || [],
          hasSourceOnDisk,
          sourceFiles: null
        };

        if (hasSourceOnDisk) {
          inDev.push(profile);
        } else {
          orphaned.push(profile);
        }

        pluginProfiles.push(profile);
      }

      // Step 5: For full mode, pull source for orphaned plugins
      if ((mode === 'full') && includeSource) {
        for (const profile of orphaned) {
          try {
            const sourceResp = await apiGet('/plugins/installed/' + profile.name + '/source');
            if (sourceResp.success) {
              profile.sourceFiles = Object.keys(sourceResp.files || {});
              profile.sourceCode = sourceResp.files;
            }
          } catch (e) {
            profile.sourceError = e.message;
          }
        }
      }

      // Step 6: For detail mode, deep-dive into specific plugin
      if (mode === 'detail' && pluginName) {
        const detailResp = await apiGet('/plugins/installed/' + pluginName);
        if (detailResp.success) {
          const detail = detailResp.plugin;
          let sourceFiles = null;
          try {
            const sourceResp = await apiGet('/plugins/installed/' + pluginName + '/source');
            if (sourceResp.success) {
              sourceFiles = sourceResp.files;
            }
          } catch (e) { /* ignore */ }

          if (outputFormat === 'json') {
            return {
              report: JSON.stringify({ plugin: detail, sourceFiles, devFolders: [...devFolders] }, null, 2),
              summary: { found: true, name: pluginName }
            };
          }

          return {
            report: this._renderDetailReport(detail, sourceFiles, devFolders),
            summary: { found: true, name: pluginName }
          };
        } else {
          return { error: 'Plugin "' + pluginName + '" not found in installed plugins' };
        }
      }

      // Step 7: Generate report
      const summary = {
        totalPlugins: installedPlugins.length,
        totalTools: allTools.length,
        orphanedCount: orphaned.length,
        inDevCount: inDev.length,
        enabledCount: installedPlugins.filter(p => p.enabled).length,
        categories: this._countCategories(allTools)
      };

      if (outputFormat === 'json') {
        const report = {
          generatedAt: new Date().toISOString(),
          summary,
          plugins: pluginProfiles,
          tools: allTools,
          devFolders: [...devFolders]
        };
        return {
          report: JSON.stringify(report, null, 2),
          summary
        };
      }

      // Markdown report
      const report = this._renderMarkdownReport(summary, pluginProfiles, allTools, orphaned, inDev, devFolders, includeSource);
      return { report, summary };
    } catch (error) {
      console.error('[' + this.name + '] Error:', error);
      return { error: error.message };
    }
  }

  _countCategories(tools) {
    const cats = {};
    for (const t of tools) {
      const c = t.category || 'unknown';
      cats[c] = (cats[c] || 0) + 1;
    }
    return cats;
  }

  _renderDetailReport(detail, sourceFiles, devFolders) {
    let md = '# Plugin Detail: ' + detail.displayName + '\n\n';
    md += '| Field | Value |\n|-------|-------|\n';
    md += '| Name | `' + detail.name + '` |\n';
    md += '| Version | ' + detail.version + ' |\n';
    md += '| Author | ' + (detail.author || '—') + ' |\n';
    md += '| Enabled | ' + (detail.enabled ? '✅ Yes' : '❌ No') + ' |\n';
    md += '| Has Source on Disk | ' + (devFolders.has(detail.name) ? '✅ Yes' : '❌ No (orphaned)') + ' |\n';
    md += '\n## Description\n\n' + (detail.description || 'No description.') + '\n';

    if (detail.tools && detail.tools.length > 0) {
      md += '\n## Tools (' + detail.tools.length + ')\n\n';
      for (const tool of detail.tools) {
        md += '### ' + tool.title + ' (`' + tool.type + '`)\n\n';
        md += '**Category:** ' + tool.category + '\n\n';
        md += (tool.description || 'No description.') + '\n';
        if (tool.schema?.inputSchema?.properties) {
          md += '\n**Parameters:**\n\n';
          md += '| Name | Type | Description |\n|------|------|-------------|\n';
          for (const [key, val] of Object.entries(tool.schema.inputSchema.properties)) {
            md += '| `' + key + '` | ' + (val.type || 'string') + ' | ' + (val.description || '—') + ' |\n';
          }
        }
        md += '\n';
      }
    }

    if (sourceFiles) {
      md += '\n## Source Files (' + Object.keys(sourceFiles).length + ')\n\n';
      for (const filename of Object.keys(sourceFiles)) {
        md += '- `' + filename + '`\n';
      }
    }

    return md;
  }

  _renderMarkdownReport(summary, profiles, allTools, orphaned, inDev, devFolders, includeSource) {
    const now = new Date().toISOString();
    let md = '';

    // Header
    md += '# 🔌 AGNT Plugin Ecosystem — Rehydration Report\n\n';
    md += '> Generated: ' + now + '\n\n';

    // Summary
    md += '## 📊 Summary\n\n';
    md += '| Metric | Count |\n|--------|-------|\n';
    md += '| Installed Plugins | ' + summary.totalPlugins + ' |\n';
    md += '| Enabled | ' + summary.enabledCount + ' |\n';
    md += '| Total Tools | ' + summary.totalTools + ' |\n';
    md += '| Source in Dev Folder | ' + summary.inDevCount + ' |\n';
    md += '| Orphaned (no source) | ' + summary.orphanedCount + ' |\n';
    md += '\n';

    // Categories
    md += '### Tools by Category\n\n';
    md += '| Category | Count |\n|----------|-------|\n';
    for (const [cat, count] of Object.entries(summary.categories).sort((a, b) => b[1] - a[1])) {
      md += '| ' + cat + ' | ' + count + ' |\n';
    }
    md += '\n';

    // Orphaned plugins warning
    if (orphaned.length > 0) {
      md += '## ⚠️ Orphaned Plugins (installed, no dev source)\n\n';
      md += 'These plugins are installed in AGNT but have no source code in the `dev/` folder. ';
      md += 'Their source is still retrievable via the AGNT API (`/plugins/installed/:name/source`).\n\n';
      md += '| Plugin | Version | Tools | Author |\n';
      md += '|--------|---------|-------|--------|\n';
      for (const p of orphaned) {
        md += '| `' + p.name + '` | ' + p.version + ' | ' + p.tools.length + ' | ' + (p.author || '—') + ' |\n';
      }
      md += '\n';
    }

    // Full plugin listing
    md += '## 🧩 All Installed Plugins\n\n';
    for (const p of profiles) {
      const statusIcon = p.enabled ? '🟢' : '⚪';
      const sourceIcon = p.hasSourceOnDisk ? '📁' : '☁️';
      md += '### ' + statusIcon + ' ' + (p.displayName || p.name) + '\n\n';
      md += '`' + p.name + '` — v' + p.version + ' ' + sourceIcon + '\n\n';
      if (p.description) md += p.description + '\n\n';
      if (p.author) md += '**Author:** ' + p.author + '\n';
      if (p.installedAt) md += '**Installed:** ' + p.installedAt + '\n';
      if (p.size) md += '**Size:** ' + this._formatBytes(p.size) + '\n';

      if (p.tools && p.tools.length > 0) {
        md += '\n**Tools (' + p.tools.length + '):**\n\n';
        for (const t of p.tools) {
          const toolFromApi = allTools.find(at => at.type === t.type);
          const cat = toolFromApi?.category || t.schema?.category || 'unknown';
          const desc = toolFromApi?.description || t.schema?.description || '';
          md += '- `' + t.type + '` *(' + cat + ')* — ' + (t.schema?.title || t.type);
          if (desc) md += ': ' + desc.substring(0, 120);
          md += '\n';
        }
      }

      // Include source code if requested and available
      if (includeSource && p.sourceCode) {
        md += '\n<details><summary>Source Code</summary>\n\n';
        for (const [filename, code] of Object.entries(p.sourceCode)) {
          md += '**`' + filename + '`**\n\n```\n' + code + '\n```\n\n';
        }
        md += '</details>\n';
      }

      md += '\n---\n\n';
    }

    // Tools index
    md += '## 🔧 Complete Tool Index\n\n';
    md += '| Tool Type | Plugin | Category | Description |\n';
    md += '|-----------|--------|----------|-------------|\n';
    for (const t of allTools.sort((a, b) => a.type.localeCompare(b.type))) {
      const desc = (t.description || '').substring(0, 80);
      md += '| `' + t.type + '` | ' + t.plugin + ' | ' + t.category + ' | ' + desc + ' |\n';
    }
    md += '\n';

    // Dev folder contents
    md += '## 📂 Dev Folder Contents\n\n';
    md += '```\n' + [...devFolders].sort().join('\n') + '\n```\n\n';

    // Footer
    md += '---\n\n';
    md += '*Report generated by `plugin-rehydration` tool v1.0.0*\n';

    return md;
  }

  _formatBytes(bytes) {
    if (!bytes) return '—';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
}

export default new PluginRehydration();
