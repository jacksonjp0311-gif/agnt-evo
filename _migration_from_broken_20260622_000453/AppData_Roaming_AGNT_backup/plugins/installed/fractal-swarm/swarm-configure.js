/**
 * Tool: swarm-configure
 * Category: utility
 * Defines swarm topology parameters and returns a validated config object.
 */

import { Limits, Governance } from './lib/governance.js';

function asNumber(v, def, min, max) {
  const n = Number(v);
  if (isNaN(n)) return def;
  return Math.max(min, Math.min(max, n));
}

function asString(v, def) {
  if (v === undefined || v === null) return def;
  return String(v).trim() || def;
}

class SwarmConfigure {
  constructor() {
    this.name = 'swarm-configure';
  }

  async execute(params) {
    try {
      const maxDepth = asNumber(params?.maxDepth ?? params?.max_depth, 3, 1, 10);
      const maxAgentsTotal = asNumber(params?.maxAgentsTotal ?? params?.max_agents_total, 25, 1, 500);
      const branchFactor = asNumber(params?.branchFactor ?? params?.branch_factor, 2, 1, 10);
      const maxConcurrent = asNumber(params?.maxConcurrent ?? params?.max_concurrent, 4, 1, 50);
      const maxResultBytes = asNumber(params?.maxResultBytes ?? params?.max_result_bytes, 250000, 1024, 10000000);
      const timeoutSeconds = asNumber(params?.timeoutSeconds ?? params?.timeout_seconds, 15, 1, 120);
      const proxyCooldownSeconds = asNumber(params?.proxyCooldownSeconds ?? params?.proxy_cooldown_seconds, 90, 5, 600);
      const demoUrl = asString(params?.demoUrl ?? params?.demo_url, 'https://example.com/');
      const instructions = asString(params?.instructions, 'Fetch and summarize the page content.');

      // Validate: branch^depth should not exceed total agents wildly
      const theoreticalMax = Math.pow(branchFactor, maxDepth + 1) - 1;
      const warnings = [];
      if (theoreticalMax > maxAgentsTotal * 2) {
        warnings.push(`Theoretical max agents (${theoreticalMax}) far exceeds cap (${maxAgentsTotal}). Tree will be pruned early.`);
      }
      if (maxConcurrent > maxAgentsTotal) {
        warnings.push(`Concurrency (${maxConcurrent}) exceeds total agents (${maxAgentsTotal}). Effective concurrency will be lower.`);
      }

      const config = {
        maxDepth,
        maxAgentsTotal,
        branchFactor,
        maxConcurrent,
        maxResultBytes,
        timeoutSeconds,
        proxyCooldownSeconds,
        demoUrl,
        instructions,
        theoreticalMaxAgents: theoreticalMax,
        governance: { maxDepth, maxAgentsTotal, branchFactor, maxConcurrent },
      };

      // Validate by constructing Governance
      const gov = new Governance(config);
      const validation = gov.canSpawn(0);

      return {
        success: true,
        config,
        validation,
        warnings,
        summary: `Swarm config: depth≤${maxDepth}, agents≤${maxAgentsTotal}, branch=${branchFactor}, concurrent≤${maxConcurrent}`,
        error: '',
      };
    } catch (error) {
      return {
        success: false,
        config: null,
        validation: null,
        warnings: [],
        summary: '',
        error: error?.message || String(error),
      };
    }
  }
}

export default new SwarmConfigure();
