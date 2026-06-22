/**
 * Tool: swarm-status
 * Category: utility
 * Real-time swarm telemetry — reads audit logs, memory events, harvest data.
 */

function asString(v, def) {
  if (v === undefined || v === null) return def;
  return String(v).trim() || def;
}

class SwarmStatus {
  constructor() {
    this.name = 'swarm-status';
  }

  async execute(params) {
    try {
      const spawnManifest = params?.spawnManifest ?? params?.spawn_manifest;
      const results = params?.results;
      const auditSummary = params?.auditSummary ?? params?.audit_summary;
      const harvest = params?.harvest;
      const proxyStats = params?.proxyStats ?? params?.proxy_stats;
      const agentId = asString(params?.agentId ?? params?.agent_id, '');
      const logType = asString(params?.logType ?? params?.log_type, 'all');

      if (!spawnManifest && !results && !auditSummary && !harvest) {
        return {
          success: false,
          events: [],
          agentCount: 0,
          totalEvents: 0,
          telemetry: null,
          errors: ['No swarm data provided. Pass spawnManifest, results, auditSummary, or harvest from a swarm-spawn run.'],
        };
      }

      const events = [];
      let agentCount = 0;
      const telemetry = {};

      // ── Agent-level status from results ──
      if (Array.isArray(results)) {
        agentCount = results.length;
        const filtered = agentId ? results.filter(r => r.agentId === agentId) : results;

        telemetry.agents = filtered.map(r => ({
          agentId: r.agentId,
          depth: r.depth,
          url: r.url,
          success: r.success,
          status: r.status,
          title: r.title,
          bytes: r.bytes,
          hasContent: !!(r.textPreview || r.content),
        }));

        telemetry.successRate = results.length > 0
          ? `${((results.filter(r => r.success).length / results.length) * 100).toFixed(1)}%`
          : 'N/A';

        telemetry.totalBytes = results.reduce((s, r) => s + (r.bytes || 0), 0);

        // Depth distribution
        const depthDist = {};
        for (const r of results) {
          const d = r.depth ?? 'unknown';
          depthDist[d] = (depthDist[d] || 0) + 1;
        }
        telemetry.depthDistribution = depthDist;

        // Status code distribution
        const statusDist = {};
        for (const r of results) {
          const s = String(r.status);
          statusDist[s] = (statusDist[s] || 0) + 1;
        }
        telemetry.statusDistribution = statusDist;

        if (logType === 'all' || logType === 'results') {
          events.push(...filtered.map(r => ({
            tMs: Date.now(),
            kind: r.success ? 'RESULT_OK' : 'RESULT_FAIL',
            agentId: r.agentId,
            status: r.status,
            url: r.url,
            bytes: r.bytes,
          })));
        }
      }

      // ── Audit summary ──
      if (auditSummary && (logType === 'all' || logType === 'audit')) {
        telemetry.audit = auditSummary;
        if (auditSummary.agentSummaries) {
          for (const [aid, summary] of Object.entries(auditSummary.agentSummaries)) {
            if (!agentId || aid === agentId) {
              events.push({
                tMs: Date.now(),
                kind: 'AUDIT_SUMMARY',
                agentId: aid,
                ...summary,
              });
            }
          }
        }
      }

      // ── Harvest summary ──
      if (harvest && (logType === 'all' || logType === 'harvest')) {
        telemetry.harvest = harvest;
        events.push({
          tMs: Date.now(),
          kind: 'HARVEST_SUMMARY',
          successCount: harvest.successCount,
          failCount: harvest.failCount,
          totalBytes: harvest.totalBytes,
          totalBytesHuman: harvest.totalBytesHuman,
        });
      }

      // ── Proxy stats ──
      if (proxyStats && Array.isArray(proxyStats) && proxyStats.length > 0) {
        telemetry.proxies = proxyStats;
        telemetry.proxySummary = {
          total: proxyStats.length,
          cooling: proxyStats.filter(p => p.cooling).length,
          avgScore: (proxyStats.reduce((s, p) => s + p.score, 0) / proxyStats.length).toFixed(2),
        };
      }

      // ── Tree structure ──
      if (spawnManifest) {
        telemetry.tree = {
          treeId: spawnManifest.treeId,
          totalAgents: spawnManifest.totalAgents,
          config: spawnManifest.config,
          rootAgentId: spawnManifest.rootAgentId,
        };
      }

      // ── Health check ──
      const healthChecks = [];
      if (telemetry.successRate) {
        const rate = parseFloat(telemetry.successRate);
        if (rate >= 90) healthChecks.push({ check: 'success_rate', status: 'healthy', detail: `${telemetry.successRate} success rate` });
        else if (rate >= 50) healthChecks.push({ check: 'success_rate', status: 'degraded', detail: `${telemetry.successRate} success rate` });
        else healthChecks.push({ check: 'success_rate', status: 'critical', detail: `${telemetry.successRate} success rate` });
      }
      if (telemetry.proxies) {
        const cooling = telemetry.proxies.filter(p => p.cooling).length;
        const totalProxies = telemetry.proxies.length;
        if (cooling === totalProxies) {
          healthChecks.push({ check: 'proxy_pool', status: 'critical', detail: 'All proxies cooling down' });
        } else if (cooling > totalProxies / 2) {
          healthChecks.push({ check: 'proxy_pool', status: 'degraded', detail: `${cooling}/${totalProxies} proxies cooling` });
        } else {
          healthChecks.push({ check: 'proxy_pool', status: 'healthy', detail: `${totalProxies - cooling}/${totalProxies} proxies available` });
        }
      }
      telemetry.health = healthChecks;

      return {
        success: true,
        events,
        agentCount,
        totalEvents: events.length,
        telemetry,
        errors: [],
        summary: agentCount > 0
          ? `Swarm status: ${agentCount} agents, ${telemetry.successRate || 'N/A'} success, ${telemetry.totalBytes ? (telemetry.totalBytes / 1024).toFixed(0) + ' KB' : '0 KB'} total`
          : 'No agent data available',
      };
    } catch (error) {
      return {
        success: false,
        events: [],
        agentCount: 0,
        totalEvents: 0,
        telemetry: null,
        errors: [error?.message || String(error)],
      };
    }
  }
}

export default new SwarmStatus();
