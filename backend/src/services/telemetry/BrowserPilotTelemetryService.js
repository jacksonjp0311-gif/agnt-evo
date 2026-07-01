import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MAX_EVENTS = 500;
const MAX_STRING = 500;
const MAX_ARRAY = 25;
const MAX_DEPTH = 4;
const LOG_PATH = path.join(__dirname, '..', '..', '..', 'data', 'browserpilot-telemetry.jsonl');
const GRAPH_PATH = path.join(__dirname, '..', '..', '..', 'data', 'browserpilot-telemetry-graph.json');

function clampString(value, max = MAX_STRING) {
  const s = String(value ?? '');
  return s.length > max ? `${s.slice(0, max)}...` : s;
}

function clean(value, depth = 0) {
  if (value == null) return value;
  if (typeof value === 'string') return clampString(value);
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (depth >= MAX_DEPTH) return '[truncated]';
  if (Array.isArray(value)) return value.slice(0, MAX_ARRAY).map((item) => clean(item, depth + 1));
  if (typeof value !== 'object') return clampString(value);

  const out = {};
  for (const [key, raw] of Object.entries(value)) {
    const safeKey = clampString(key, 80);
    if (/password|token|secret|apiKey|authorization|cookie/i.test(safeKey)) {
      out[safeKey] = '[redacted]';
      continue;
    }
    if (/pageText|selection|message|content|text/i.test(safeKey) && typeof raw === 'string') {
      out[`${safeKey}Chars`] = raw.length;
      continue;
    }
    out[safeKey] = clean(raw, depth + 1);
  }
  return out;
}

class BrowserPilotTelemetryService {
  constructor() {
    this.events = [];
    this.graph = this.createEmptyGraph();
    this.graphLoaded = false;
    this.graphLoadPromise = this.loadGraph().catch(() => {});
  }

  createEmptyGraph() {
    return {
      schemaVersion: 'browserpilot.telemetryGraph.v1',
      source: 'browserpilot',
      createdAt: new Date().toISOString(),
      updatedAt: null,
      counters: {
        events: 0,
        errors: 0,
        blocked: 0,
        commands: 0,
        captures: 0,
        chats: 0,
      },
      nodes: {},
      edges: [],
      lastAnalysis: null,
    };
  }

  async loadGraph() {
    try {
      const raw = await fs.readFile(GRAPH_PATH, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && parsed.schemaVersion) {
        this.graph = { ...this.createEmptyGraph(), ...parsed };
      }
    } catch {
      this.graph = this.createEmptyGraph();
    } finally {
      this.graphLoaded = true;
    }
  }

  async ensureGraphLoaded() {
    if (!this.graphLoaded) await this.graphLoadPromise;
  }

  record(input = {}) {
    const event = {
      id: `bp-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      ts: input.ts || new Date().toISOString(),
      source: 'browserpilot',
      eventType: clampString(input.eventType || input.type || 'event', 80),
      adapter: clampString(input.adapter || input.browser || 'unknown', 40),
      data: clean(input.data && typeof input.data === 'object' ? input.data : input),
    };

    delete event.data.eventType;
    delete event.data.type;
    delete event.data.ts;
    delete event.data.adapter;
    delete event.data.browser;

    this.events.push(event);
    if (this.events.length > MAX_EVENTS) this.events.splice(0, this.events.length - MAX_EVENTS);
    this.updateGraph(event);
    this.appendLog(event).catch(() => {});
    this.persistGraph().catch(() => {});
    return event;
  }

  recent(limit = 100) {
    const n = Math.max(1, Math.min(Number(limit) || 100, MAX_EVENTS));
    return this.events.slice(-n);
  }

  summary(limit = 200) {
    const events = this.recent(limit);
    const byType = {};
    const commandKinds = {};
    let errors = 0;
    let blocked = 0;
    let lastTab = null;

    for (const event of events) {
      byType[event.eventType] = (byType[event.eventType] || 0) + 1;
      const kind = event.data?.kind || event.data?.commandKind;
      if (kind) commandKinds[kind] = (commandKinds[kind] || 0) + 1;
      if (/error|failed/i.test(event.eventType)) errors++;
      if (/blocked/i.test(event.eventType)) blocked++;
      if (event.data?.url || event.data?.title || event.data?.tabId) {
        lastTab = {
          tabId: event.data?.tabId ?? null,
          url: event.data?.url ?? null,
          title: event.data?.title ?? null,
          at: event.ts,
        };
      }
    }

    return {
      source: 'browserpilot',
      windowSize: events.length,
      lastSeen: events.at(-1)?.ts || null,
      byType,
      commandKinds,
      errors,
      blocked,
      lastTab,
    };
  }

  node(id, type, label, meta = {}) {
    const existing = this.graph.nodes[id] || {
      id,
      type,
      label,
      weight: 0,
      firstSeen: new Date().toISOString(),
      lastSeen: null,
      meta: {},
    };
    existing.weight += 1;
    existing.lastSeen = new Date().toISOString();
    existing.meta = { ...existing.meta, ...clean(meta) };
    this.graph.nodes[id] = existing;
    return existing;
  }

  edge(from, to, relation) {
    if (!from || !to || from === to) return;
    const id = `${from}->${relation}->${to}`;
    let item = this.graph.edges.find((edge) => edge.id === id);
    if (!item) {
      item = { id, from, to, relation, weight: 0, lastSeen: null };
      this.graph.edges.push(item);
    }
    item.weight += 1;
    item.lastSeen = new Date().toISOString();
    if (this.graph.edges.length > 1000) {
      this.graph.edges.sort((a, b) => b.weight - a.weight);
      this.graph.edges = this.graph.edges.slice(0, 1000);
    }
  }

  updateGraph(event) {
    const data = event.data || {};
    this.graph.updatedAt = event.ts;
    this.graph.counters.events += 1;
    if (/error|failed/i.test(event.eventType)) this.graph.counters.errors += 1;
    if (/blocked/i.test(event.eventType)) this.graph.counters.blocked += 1;
    if (/command/i.test(event.eventType)) this.graph.counters.commands += 1;
    if (/captured/i.test(event.eventType)) this.graph.counters.captures += 1;
    if (/chat/i.test(event.eventType)) this.graph.counters.chats += 1;

    const eventNode = this.node(`event:${event.eventType}`, 'event', event.eventType);
    const adapterNode = this.node(`adapter:${event.adapter}`, 'adapter', event.adapter);
    this.edge(adapterNode.id, eventNode.id, 'emits');

    const kind = data.kind || data.commandKind;
    if (kind) {
      const commandNode = this.node(`command:${kind}`, 'command', kind, { risk: data.risk, reason: data.reason });
      this.edge(eventNode.id, commandNode.id, 'observed_command');
    }

    if (data.url) {
      let host = data.url;
      try { host = new URL(data.url).hostname; } catch {}
      const pageNode = this.node(`page:${host}`, 'page', host, { url: data.url, title: data.title });
      this.edge(eventNode.id, pageNode.id, 'observed_on');
    }

    if (data.agentName || data.agentId) {
      const agentLabel = data.agentName || data.agentId;
      const agentNode = this.node(`agent:${agentLabel}`, 'agent', agentLabel, { agentId: data.agentId });
      this.edge(agentNode.id, eventNode.id, 'participated_in');
    }
  }

  graphSnapshot() {
    return {
      ...this.graph,
      nodes: Object.values(this.graph.nodes).sort((a, b) => b.weight - a.weight),
      edges: this.graph.edges.slice().sort((a, b) => b.weight - a.weight),
    };
  }

  analyze(limit = 200) {
    const summary = this.summary(limit);
    const graph = this.graphSnapshot();
    const topEvents = Object.entries(summary.byType).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const topCommands = Object.entries(summary.commandKinds).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const pages = graph.nodes.filter((node) => node.type === 'page').slice(0, 8);
    const toolHints = [];

    if (summary.blocked > 0) toolHints.push('Prefer lower-risk browser commands or require confirmation before destructive actions.');
    if (summary.errors > 0) toolHints.push('Inspect recent command_error events before selecting more automation tools.');
    if (topCommands.some(([name]) => name === 'navigate' || name === 'click' || name === 'type')) {
      toolHints.push('Browser operation tools are relevant for the current task context.');
    }
    if (summary.windowSize === 0) toolHints.push('No BrowserPilot sensory data yet; capture the page before tool selection.');

    const analysis = {
      analyzedAt: new Date().toISOString(),
      summary,
      topEvents,
      topCommands,
      pages: pages.map((node) => ({ label: node.label, weight: node.weight, meta: node.meta })),
      toolHints,
      graphStats: {
        nodes: graph.nodes.length,
        edges: graph.edges.length,
      },
    };

    this.graph.lastAnalysis = analysis;
    this.graph.updatedAt = analysis.analyzedAt;
    this.persistGraph().catch(() => {});
    return analysis;
  }

  clear() {
    const count = this.events.length;
    this.events = [];
    return count;
  }

  async clearGraph() {
    this.graph = this.createEmptyGraph();
    await this.persistGraph();
    return true;
  }

  async appendLog(event) {
    await fs.mkdir(path.dirname(LOG_PATH), { recursive: true });
    await fs.appendFile(LOG_PATH, JSON.stringify(event) + '\n', 'utf8');
  }

  async persistGraph() {
    await fs.mkdir(path.dirname(GRAPH_PATH), { recursive: true });
    await fs.writeFile(GRAPH_PATH, JSON.stringify(this.graph, null, 2), 'utf8');
  }
}

export default new BrowserPilotTelemetryService();
