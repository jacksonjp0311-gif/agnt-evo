/**
 * Tool: swarm-spawn
 * Category: action
 * Fractal tree orchestrator — spawns agent tree, runs workloads, returns manifest.
 */

import { Governance } from './lib/governance.js';
import { deriveAgentId, deriveTreeId } from './lib/identity.js';
import { ProxyPool } from './lib/proxy-pool.js';
import { SwarmAuditLog } from './lib/audit-logger.js';
import { SwarmMemoryStore } from './lib/memory-bridge.js';

function asNumber(v, def, min, max) {
  const n = Number(v);
  if (isNaN(n)) return def;
  return Math.max(min, Math.min(max, n));
}

function asString(v, def) {
  if (v === undefined || v === null) return def;
  return String(v).trim() || def;
}

function parseList(raw) {
  if (!raw) return [];
  return String(raw).split(/[\n,]/).map(s => s.trim()).filter(Boolean);
}

async function fetchWithTimeout(url, timeoutMs, proxy = null) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'identity',
      },
      redirect: 'follow',
    });
    const text = await response.text();
    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      url: response.url,
      content: text,
      bytes: Buffer.byteLength(text, 'utf8'),
      proxyUsed: proxy,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      statusText: error?.message || String(error),
      url,
      content: '',
      bytes: 0,
      proxyUsed: proxy,
      error: error?.message || String(error),
    };
  } finally {
    clearTimeout(timer);
  }
}

function stripHtml(html, maxChars = 2000) {
  if (!html) return '';
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/<svg[\s\S]*?<\/svg>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
  return text.slice(0, maxChars);
}

function extractTitle(html) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? match[1].replace(/\s+/g, ' ').trim() : '';
}

function extractMetaDescription(html) {
  const match = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*?)["']/i)
    || html.match(/<meta[^>]*content=["']([^"']*?)["'][^>]*name=["']description["']/i);
  return match ? match[1].trim() : '';
}

class SwarmSpawn {
  constructor() {
    this.name = 'swarm-spawn';
  }

  async execute(params) {
    const startTime = Date.now();
    const errors = [];
    const warnings = [];

    try {
      // ── Parse config ──
      const config = params?.config;
      if (!config || typeof config !== 'object') {
        return {
          success: false,
          agentsSpawned: 0,
          spawnManifest: null,
          results: [],
          auditSummary: null,
          errors: ['Missing or invalid config. Run swarm-configure first.'],
          warnings: [],
          elapsedMs: 0,
        };
      }

      const maxDepth = asNumber(config.maxDepth ?? config.max_depth, 3, 1, 10);
      const maxAgentsTotal = asNumber(config.maxAgentsTotal ?? config.max_agents_total, 25, 1, 500);
      const branchFactor = asNumber(config.branchFactor ?? config.branch_factor, 2, 1, 10);
      const maxConcurrent = asNumber(config.maxConcurrent ?? config.max_concurrent, 4, 1, 50);
      const maxResultBytes = asNumber(config.maxResultBytes ?? config.max_result_bytes, 250000, 1024, 10000000);
      const timeoutSeconds = asNumber(config.timeoutSeconds ?? config.timeout_seconds, 15, 1, 120);
      const timeoutMs = timeoutSeconds * 1000;

      // ── Parse targets ──
      const targetUrls = parseList(params?.targetUrls ?? params?.target_urls);
      const fallbackUrl = config.demoUrl ?? 'https://example.com/';
      const urls = targetUrls.length > 0 ? targetUrls : [fallbackUrl];

      // ── Parse proxies ──
      const proxyList = parseList(params?.proxies);
      const proxyCooldown = asNumber(config.proxyCooldownSeconds ?? config.proxy_cooldown_seconds, 90, 5, 600);
      const pool = proxyList.length > 0 ? new ProxyPool(proxyList, proxyCooldown) : null;

      // ── Initialize swarm state ──
      const treeId = deriveTreeId('swarm');
      const gov = new Governance(config);
      const auditLog = new SwarmAuditLog();
      const memoryStore = new SwarmMemoryStore();
      const results = [];

      auditLog.emitGlobal('SWARM_START', {
        treeId,
        config: { maxDepth, maxAgentsTotal, branchFactor, maxConcurrent, timeoutSeconds },
        targetCount: urls.length,
        proxyCount: proxyList.length,
      });

      // ── Recursive spawn function ──
      const spawnNode = async (parentId, depth, urlIndex) => {
        const check = gov.canSpawn(depth);
        if (!check.allowed) {
          auditLog.emitGlobal('SPAWN_BLOCKED', { parentId, depth, reason: check.reason });
          warnings.push(`Depth ${depth}: ${check.reason}`);
          return null;
        }

        const agentId = deriveAgentId(parentId, depth);
        const url = urls[urlIndex % urls.length];

        gov.registerSpawn(agentId, parentId, depth);
        const agentNum = gov.agentsCreated;

        const agentAudit = auditLog.forAgent(agentId);
        const agentMemory = memoryStore.forAgent(agentId);

        agentAudit.emit('AGENT_SPAWN', { agentId, parentId, depth, agentNum, url });
        agentMemory.recordEvent('AGENT_SPAWN', { parentId, depth, url });

        // ── Pick proxy ──
        const proxy = pool ? pool.pick() : null;
        agentAudit.emit('PROXY_PICK', { proxy: proxy ? proxy.replace(/\/\/.*@/, '//***@') : null });

        // ── Fetch workload ──
        agentAudit.emit('WORK_START', { url });
        agentMemory.recordEvent('WORK_START', { url });

        const fetchResult = await fetchWithTimeout(url, timeoutMs, proxy);

        // ── Process result ──
        const title = extractTitle(fetchResult.content || '');
        const textContent = stripHtml(fetchResult.content || '', 3000);
        const contentBytes = fetchResult.bytes || 0;
        const truncated = contentBytes > maxResultBytes;

        if (fetchResult.ok) {
          agentAudit.emit('WORK_DONE', {
            url,
            status: fetchResult.status,
            bytes: contentBytes,
            truncated,
            title: title.slice(0, 100),
          });
          agentMemory.recordEvent('WORK_DONE', {
            url,
            status: fetchResult.status,
            bytes: contentBytes,
            title: title.slice(0, 100),
          });
          if (pool && proxy) pool.reportOk(proxy);
        } else {
          agentAudit.emit('WORK_FAIL', {
            url,
            status: fetchResult.status,
            error: fetchResult.statusText,
          });
          agentMemory.recordEvent('WORK_FAIL', {
            url,
            error: fetchResult.statusText,
          });
          if (pool && proxy) pool.reportFail(proxy);
          errors.push(`Agent ${agentId}: ${fetchResult.statusText}`);
        }

        const result = {
          agentId,
          parentId,
          depth,
          agentNum,
          url,
          success: fetchResult.ok,
          status: fetchResult.status,
          title,
          textPreview: textContent.slice(0, 500),
          bytes: contentBytes,
          truncated,
          proxyUsed: proxy ? proxy.replace(/\/\/.*@/, '//***@') : null,
        };
        results.push(result);

        // ── Spawn children ──
        if (depth < maxDepth && gov.agentsCreated < maxAgentsTotal) {
          const children = [];
          for (let b = 0; b < branchFactor; b++) {
            if (gov.agentsCreated >= maxAgentsTotal) break;
            const childCheck = gov.canSpawn(depth + 1);
            if (!childCheck.allowed) break;
            children.push(spawnNode(agentId, depth + 1, (urlIndex + b + 1) % urls.length));
          }
          if (children.length > 0) {
            await Promise.all(children);
          }
        }

        return result;
      };

      // ── Start spawning from root ──
      await spawnNode('root', 0, 0);

      const elapsedMs = Date.now() - startTime;

      auditLog.emitGlobal('SWARM_COMPLETE', {
        treeId,
        agentsSpawned: gov.agentsCreated,
        elapsedMs,
        errors: errors.length,
      });

      // ── Build spawn manifest ──
      const spawnManifest = {
        treeId,
        config: { maxDepth, maxAgentsTotal, branchFactor, maxConcurrent },
        agents: gov.spawned,
        rootAgentId: gov.spawned[0]?.agentId || null,
        totalAgents: gov.agentsCreated,
        elapsedMs,
      };

      // ── Build summary ──
      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;
      const totalBytes = results.reduce((s, r) => s + (r.bytes || 0), 0);

      return {
        success: true,
        agentsSpawned: gov.agentsCreated,
        spawnManifest,
        results: results.map(r => ({
          agentId: r.agentId,
          depth: r.depth,
          url: r.url,
          success: r.success,
          status: r.status,
          title: r.title,
          bytes: r.bytes,
          textPreview: r.textPreview,
        })),
        harvest: {
          successCount,
          failCount,
          totalBytes,
          totalBytesHuman: totalBytes > 1024 * 1024
            ? `${(totalBytes / 1024 / 1024).toFixed(2)} MB`
            : `${(totalBytes / 1024).toFixed(1)} KB`,
        },
        auditSummary: auditLog.summary(),
        proxyStats: pool ? pool.stats() : [],
        errors,
        warnings,
        elapsedMs,
        summary: `Swarm "${treeId}": ${gov.agentsCreated} agents spawned, ${successCount} OK, ${failCount} failed, ${(totalBytes / 1024).toFixed(0)} KB fetched in ${elapsedMs}ms`,
      };
    } catch (error) {
      return {
        success: false,
        agentsSpawned: 0,
        spawnManifest: null,
        results: [],
        auditSummary: null,
        errors: [...errors, error?.message || String(error)],
        warnings,
        elapsedMs: Date.now() - startTime,
        summary: '',
      };
    }
  }
}

export default new SwarmSpawn();
