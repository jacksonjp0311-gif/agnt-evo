/**
 * Tool: swarm-prune
 * Category: action
 * Harvests results from swarm, generates sacrifice hashes, produces cleanup report.
 */

function asString(v, def) {
  if (v === undefined || v === null) return def;
  return String(v).trim() || def;
}

function sha256Hex(input) {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(input, 'utf8').digest('hex');
}

class SwarmPrune {
  constructor() {
    this.name = 'swarm-prune';
  }

  async execute(params) {
    const startTime = Date.now();
    const errors = [];

    try {
      const spawnManifest = params?.spawnManifest ?? params?.spawn_manifest;
      const results = params?.results;
      const harvestData = params?.harvest ?? params?.harvestData;

      if (!spawnManifest && !results && !harvestData) {
        return {
          success: false,
          harvestedCount: 0,
          harvestData: [],
          sacrificeHashes: [],
          totalBytes: 0,
          cleanupReport: null,
          errors: ['No spawnManifest, results, or harvest data provided.'],
          elapsedMs: 0,
        };
      }

      // ── Harvest results ──
      const harvested = [];
      const sacrificeHashes = [];
      let totalBytes = 0;

      // Process from results array (from swarm-spawn)
      const sourceResults = results || (harvestData?.successCount !== undefined ? null : harvestData);

      if (Array.isArray(sourceResults)) {
        for (const r of sourceResults) {
          const agentId = r.agentId || r.agent_id || 'unknown';
          const resultPreview = r.textPreview || r.result_preview || r.content || '';
          const bytes = r.bytes || 0;
          totalBytes += bytes;

          harvested.push({
            agentId,
            depth: r.depth ?? null,
            url: r.url ?? '',
            success: r.success ?? false,
            status: r.status ?? 0,
            title: r.title ?? '',
            resultPreview: String(resultPreview).slice(0, 2000),
            bytes,
          });

          // ── Generate sacrifice hash ──
          const cocktail = `${agentId}|${r.url || ''}|${r.status || 0}|${bytes}|${Date.now()}`;
          const sacrificeHash = sha256Hex(cocktail);
          sacrificeHashes.push({
            agentId,
            sha256: sacrificeHash,
            timestamp: new Date().toISOString(),
          });
        }
      } else if (harvestData) {
        // From harvest summary
        harvested.push({
          agentId: 'swarm-aggregate',
          depth: null,
          url: '',
          success: true,
          status: 200,
          title: 'Swarm Harvest Summary',
          resultPreview: JSON.stringify(harvestData),
          bytes: harvestData.totalBytes || 0,
        });
        totalBytes = harvestData.totalBytes || 0;
      }

      // ── Build cleanup report ──
      const agentsPruned = harvested.length;
      const agentsSuccessful = harvested.filter(h => h.success).length;
      const agentsFailed = harvested.filter(h => !h.success).length;

      const cleanupReport = {
        timestamp: new Date().toISOString(),
        agentsPruned,
        agentsSuccessful,
        agentsFailed,
        totalBytes,
        totalBytesHuman: totalBytes > 1024 * 1024
          ? `${(totalBytes / 1024 / 1024).toFixed(2)} MB`
          : `${(totalBytes / 1024).toFixed(1)} KB`,
        sacrificeCount: sacrificeHashes.length,
        treeId: spawnManifest?.treeId || 'unknown',
        config: spawnManifest?.config || null,
        status: 'pruned',
      };

      // ── Build sacrifice log (text format) ──
      const sacrificeLogLines = sacrificeHashes.map(
        s => `${s.agentId} ${s.sha256}  # ${s.timestamp}`
      );
      const sacrificeLog = sacrificeLogLines.join('\n');

      // ── Build harvest JSONL ──
      const harvestJsonl = harvested.map(h => JSON.stringify(h)).join('\n');

      const elapsedMs = Date.now() - startTime;

      return {
        success: true,
        harvestedCount: agentsPruned,
        harvestData: harvested,
        harvestJsonl,
        sacrificeHashes,
        sacrificeLog,
        totalBytes,
        cleanupReport,
        errors,
        elapsedMs,
        summary: `Pruned ${agentsPruned} agents (${agentsSuccessful} OK, ${agentsFailed} failed), ${(totalBytes / 1024).toFixed(0)} KB harvested, ${sacrificeHashes.length} sacrifice hashes generated`,
      };
    } catch (error) {
      return {
        success: false,
        harvestedCount: 0,
        harvestData: [],
        sacrificeHashes: [],
        totalBytes: 0,
        cleanupReport: null,
        errors: [...errors, error?.message || String(error)],
        elapsedMs: Date.now() - startTime,
      };
    }
  }
}

export default new SwarmPrune();
