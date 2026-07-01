import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MAX_EVENTS = 500;
const MAX_STRING = 500;
const MAX_ARRAY = 25;
const MAX_DEPTH = 4;
const MAX_GOLDEN_TRACES = 100;
const MAX_REPORTS = 30;
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

function selectorScore(css) {
  const s = String(css || '').trim();
  if (!s) return { score: 0, class: 'missing', reasons: ['missing selector'] };

  let score = 50;
  const reasons = [];
  if (/\[data-testid=|\[data-test=|\[data-cy=|\[aria-label=|\[name=|\[role=/.test(s)) {
    score += 25;
    reasons.push('stable attribute');
  }
  if (/#[-_a-zA-Z0-9]+/.test(s)) {
    score += 15;
    reasons.push('id selector');
  }
  if (/button|input|textarea|select|\[contenteditable=|\[role="textbox"|\[role='textbox'/.test(s)) {
    score += 10;
    reasons.push('interactive target');
  }
  if (/:nth-child|:nth-of-type|>\s*[^[]/.test(s)) {
    score -= 25;
    reasons.push('positional path');
  }
  if (s.length > 120) {
    score -= 15;
    reasons.push('long selector');
  }
  if (!/\[|#|\./.test(s)) {
    score -= 10;
    reasons.push('broad selector');
  }

  score = Math.max(0, Math.min(100, score));
  const klass = score >= 80 ? 'strong' : score >= 55 ? 'usable' : 'fragile';
  return { score, class: klass, reasons };
}

function inferFailureClass(eventType, data = {}) {
  const haystack = `${eventType} ${data.error || ''} ${data.reason || ''}`.toLowerCase();
  if (/no element|selector|matches|nth-child|not found/.test(haystack)) return 'wrong element / selector ambiguity';
  if (/timeout|slow|network|waiting/.test(haystack)) return 'slow / timeout';
  if (/login|permission|forbidden|unauthorized|auth/.test(haystack)) return 'blocked by login / permissions';
  if (/blocked|risk|confirm|policy/.test(haystack)) return 'policy hesitation';
  if (/dom|changed|drift|stale/.test(haystack)) return 'page changed / DOM drift';
  if (/fail|error/.test(haystack)) return 'general execution failure';
  return null;
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
        successes: 0,
        goldenTraces: 0,
      },
      nodes: {},
      edges: [],
      goldenTraces: [],
      evolutionReports: [],
      selectorPolicy: null,
      lastAnalysis: null,
    };
  }

  async loadGraph() {
    try {
      const raw = await fs.readFile(GRAPH_PATH, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && parsed.schemaVersion) {
        const empty = this.createEmptyGraph();
        this.graph = {
          ...empty,
          ...parsed,
          counters: { ...empty.counters, ...(parsed.counters || {}) },
          nodes: parsed.nodes || {},
          edges: Array.isArray(parsed.edges) ? parsed.edges : [],
          goldenTraces: Array.isArray(parsed.goldenTraces) ? parsed.goldenTraces : [],
          evolutionReports: Array.isArray(parsed.evolutionReports) ? parsed.evolutionReports : [],
          selectorPolicy: parsed.selectorPolicy || null,
        };
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
    const outcomes = { success: 0, failure: 0 };
    const failureClasses = {};
    let errors = 0;
    let blocked = 0;
    let lastTab = null;

    for (const event of events) {
      byType[event.eventType] = (byType[event.eventType] || 0) + 1;
      const kind = event.data?.kind || event.data?.commandKind;
      if (kind) commandKinds[kind] = (commandKinds[kind] || 0) + 1;
      if (/error|failed/i.test(event.eventType)) errors++;
      if (/blocked/i.test(event.eventType)) blocked++;
      if (/success|completed/i.test(event.eventType) || event.data?.ok === true) outcomes.success++;
      if (/error|failed/i.test(event.eventType) || event.data?.ok === false) outcomes.failure++;
      const failureClass = inferFailureClass(event.eventType, event.data);
      if (failureClass) failureClasses[failureClass] = (failureClasses[failureClass] || 0) + 1;
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
      outcomes,
      failureClasses,
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
    if (/success|completed/i.test(event.eventType) || data.ok === true) this.graph.counters.successes += 1;

    const eventNode = this.node(`event:${event.eventType}`, 'event', event.eventType);
    const adapterNode = this.node(`adapter:${event.adapter}`, 'adapter', event.adapter);
    this.edge(adapterNode.id, eventNode.id, 'emits');

    const kind = data.kind || data.commandKind;
    if (kind) {
      const commandNode = this.node(`command:${kind}`, 'command', kind, { risk: data.risk, reason: data.reason });
      this.edge(eventNode.id, commandNode.id, 'observed_command');
    }

    if (data.css) {
      const selector = String(data.css);
      const score = selectorScore(selector);
      const selectorNode = this.node(`selector:${selector}`, 'selector', selector, {
        score: score.score,
        class: score.class,
        reasons: score.reasons,
        kind,
      });
      this.edge(eventNode.id, selectorNode.id, 'used_selector');
      if (kind) this.edge(selectorNode.id, `command:${kind}`, 'supports_command');
    }

    const failureClass = inferFailureClass(event.eventType, data);
    if (failureClass) {
      const failureNode = this.node(`failure:${failureClass}`, 'failure_class', failureClass);
      this.edge(eventNode.id, failureNode.id, 'classified_as');
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
    const selectors = graph.nodes.filter((node) => node.type === 'selector').slice(0, 12);
    const toolHints = [];

    if (summary.blocked > 0) toolHints.push('Prefer lower-risk browser commands or require confirmation before destructive actions.');
    if (summary.errors > 0) toolHints.push('Inspect recent command_error events before selecting more automation tools.');
    if (topCommands.some(([name]) => name === 'navigate' || name === 'click' || name === 'type')) {
      toolHints.push('Browser operation tools are relevant for the current task context.');
    }
    if (summary.windowSize === 0) toolHints.push('No BrowserPilot sensory data yet; capture the page before tool selection.');
    if (selectors.some((node) => node.meta?.class === 'fragile')) {
      toolHints.push('Selector hardening is recommended: prefer data-testid, aria-label, role, name, or id selectors before positional CSS.');
    }

    const analysis = {
      analyzedAt: new Date().toISOString(),
      summary,
      topEvents,
      topCommands,
      pages: pages.map((node) => ({ label: node.label, weight: node.weight, meta: node.meta })),
      selectors: selectors.map((node) => ({ label: node.label, weight: node.weight, meta: node.meta })),
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

  selectorPolicy(limit = 200) {
    const graph = this.graphSnapshot();
    const selectors = graph.nodes
      .filter((node) => node.type === 'selector')
      .map((node) => ({
        selector: node.label,
        weight: node.weight,
        score: node.meta?.score ?? selectorScore(node.label).score,
        class: node.meta?.class ?? selectorScore(node.label).class,
        reasons: node.meta?.reasons || [],
      }))
      .sort((a, b) => (b.score * b.weight) - (a.score * a.weight))
      .slice(0, Math.max(1, Math.min(Number(limit) || 20, 50)));

    const policy = {
      generatedAt: new Date().toISOString(),
      rules: [
        'Prefer stable attributes in this order: data-testid/data-test/data-cy, aria-label, role+name, id, semantic tag.',
        'Before critical clicks or typing, verify the target exists and is visible; use waitForSelector when the page is changing.',
        'Avoid nth-child, long parent chains, and broad text-only selectors unless no stable attribute exists.',
        'When a selector fails once, run domAudit or capture page context before retrying with a different selector.',
        'Ask before irreversible submits, purchases, deletes, posts, or messages unless the user explicitly approved that action.'
      ],
      preferredSelectors: selectors.filter((item) => item.class !== 'fragile').slice(0, 10),
      fragileSelectors: selectors.filter((item) => item.class === 'fragile').slice(0, 10),
    };

    this.graph.selectorPolicy = policy;
    this.graph.updatedAt = policy.generatedAt;
    this.persistGraph().catch(() => {});
    return policy;
  }

  diagnostics(limit = 300) {
    const analysis = this.analyze(limit);
    const selectorPolicy = this.selectorPolicy();
    const summary = analysis.summary;
    const totalOutcomes = summary.outcomes.success + summary.outcomes.failure;
    const successRate = totalOutcomes ? Math.round((summary.outcomes.success / totalOutcomes) * 100) : 0;
    const selectorScores = analysis.selectors.map((item) => Number(item.meta?.score || 0)).filter(Boolean);
    const selectorStability = selectorScores.length
      ? Math.round(selectorScores.reduce((sum, n) => sum + n, 0) / selectorScores.length)
      : 0;
    const recovery = summary.errors ? Math.max(0, Math.min(100, Math.round((summary.outcomes.success / (summary.errors + summary.outcomes.success)) * 100))) : 100;
    const userEffort = Math.max(0, Math.min(100, 100 - Math.min(80, (summary.byType.chat_sent || 0) * 2)));

    const recommendations = [
      ...analysis.toolHints,
      selectorPolicy.fragileSelectors.length
        ? 'Harden the fragile selectors listed in selectorPolicy.fragileSelectors.'
        : 'Selector policy is healthy; keep preferring stable attributes.',
      summary.errors
        ? 'Review the top failure classes before adding new automation steps.'
        : 'No recent command failures detected in the telemetry window.',
      this.graph.goldenTraces.length
        ? 'Use the most recent golden trace as the default path for similar tasks.'
        : 'Save the next successful run as a golden trace to create a replayable template.'
    ];

    const report = {
      id: `bp-report-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      generatedAt: new Date().toISOString(),
      metrics: {
        successRate,
        selectorStability,
        recoveryFromFailure: recovery,
        userEffort,
        graphNodes: analysis.graphStats.nodes,
        graphEdges: analysis.graphStats.edges,
      },
      topEvents: analysis.topEvents,
      topCommands: analysis.topCommands,
      failureClasses: summary.failureClasses,
      recommendations,
      selectorPolicy,
      workflowBlueprints: [
        {
          name: 'BrowserPilot Daily Diagnostics',
          cadence: 'daily',
          steps: ['analyze telemetry', 'cluster failure classes', 'refresh selector policy', 'write evolution report']
        },
        {
          name: 'BrowserPilot Golden Trace Review',
          cadence: 'weekly',
          steps: ['list golden traces', 'promote the best trace per task family', 'retire stale selectors']
        }
      ]
    };

    this.graph.evolutionReports = [report, ...(this.graph.evolutionReports || [])].slice(0, MAX_REPORTS);
    this.graph.lastAnalysis = analysis;
    this.graph.updatedAt = report.generatedAt;
    this.persistGraph().catch(() => {});
    return report;
  }

  saveGoldenTrace(input = {}) {
    const trace = {
      id: `bp-golden-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      createdAt: new Date().toISOString(),
      goal: clampString(input.goal || input.name || 'Untitled browser run', 180),
      successCriteria: clampString(input.successCriteria || 'User confirmed the run was successful.', 240),
      correction: clampString(input.correction || '', 240),
      riskPosture: clampString(input.riskPosture || 'Ask before irreversible actions.', 120),
      interactionStyle: clampString(input.interactionStyle || 'Just do it, narrate minimally.', 120),
      context: clean(input.context || {}),
      commands: clean(Array.isArray(input.commands) ? input.commands : []),
      outcome: clean(input.outcome || { status: 'success' }),
    };

    this.graph.goldenTraces = [trace, ...(this.graph.goldenTraces || [])].slice(0, MAX_GOLDEN_TRACES);
    this.graph.counters.goldenTraces = this.graph.goldenTraces.length;

    const traceNode = this.node(`golden:${trace.id}`, 'golden_trace', trace.goal, {
      successCriteria: trace.successCriteria,
      correction: trace.correction,
    });
    if (trace.context?.page?.url) {
      let host = trace.context.page.url;
      try { host = new URL(trace.context.page.url).hostname; } catch {}
      const pageNode = this.node(`page:${host}`, 'page', host, trace.context.page);
      this.edge(traceNode.id, pageNode.id, 'validated_on');
    }

    this.graph.updatedAt = trace.createdAt;
    this.persistGraph().catch(() => {});
    return trace;
  }

  goldenTraces(limit = 20) {
    const n = Math.max(1, Math.min(Number(limit) || 20, MAX_GOLDEN_TRACES));
    return (this.graph.goldenTraces || []).slice(0, n);
  }

  evolutionContext() {
    const policy = this.graph.selectorPolicy || this.selectorPolicy();
    return {
      generatedAt: new Date().toISOString(),
      selectorPolicy: policy,
      goldenTraces: this.goldenTraces(5).map((trace) => ({
        goal: trace.goal,
        successCriteria: trace.successCriteria,
        correction: trace.correction,
        commands: trace.commands,
      })),
      lastReport: (this.graph.evolutionReports || [])[0] || null,
    };
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
