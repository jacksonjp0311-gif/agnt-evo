/**
 * AGNT Codec Integration v1.1.0 — CJS shim for orchestrator injection.
 * 
 * This is the CJS-compatible entry point for Node.js createRequire().
 * It re-implements the v1.1.0 scoring contract synchronously.
 * The ESM version (codec-integration.js) is the canonical source.
 */

const fs = require('fs');
const path = require('path');

const CAPABILITY_PATH = path.join(__dirname, 'capability-index.json');
const CONFIG_PATH = path.join(__dirname, 'config.json');
const LOG_PATH = path.join(__dirname, 'selection-log.json');

// ─── STOPWORDS (minimal — only true filler words) ────────────────────────────

const STOPWORDS = new Set([
  'the','a','an','is','are','was','were','be','been','have','has','had','do','does','did',
  'will','would','could','should','may','might','shall','can','need','to','of','in','for','on',
  'with','at','by','from','as','into','through','during','before','after','above','below',
  'between','out','off','over','under','again','further','then','once','here','there','when',
  'where','why','how','all','each','every','both','few','more','most','other','some','such',
  'no','nor','not','only','own','same','so','than','too','very','just','because','but','and',
  'or','if','while','about','up','that','this','these','those','what','which','who','whom','its',
  'our','also','want','like','make','know','time','come','back','much','show','tell','give','run'
]);

// ─── INTENT PATTERNS ─────────────────────────────────────────────────────────

const INTENT_PATTERNS = {
  monitor: ['check','status','health','monitor','watch','track','observe','survey','inspect','diagnose','alert','coherence','drift','anomaly'],
  create: ['create','build','make','generate','write','compose','design','forge','craft','spawn','implement','develop'],
  search: ['find','search','look','locate','discover','query','fetch','retrieve','get','list','browse','explore'],
  analyze: ['analyze','evaluate','assess','review','study','examine','investigate','benchmark','compare','profile','measure'],
  fix: ['fix','repair','resolve','debug','patch','correct','heal','restore','remediate','troubleshoot'],
  deploy: ['deploy','release','publish','push','ship','launch','install','activate','submit'],
  configure: ['configure','setup','set','update','change','modify','adjust','tune','optimize','enable','disable']
};

const DOMAINS = {
  system: ['scm','health','monitor','scheduler','workflow','execution','coherence','ecosystem','state','status','plugin','plugins','tools'],
  finance: ['credit','burn','wallet','balance','transaction','cost','bitcoin','price','fee','bank','trading'],
  development: ['code','git','github','build','test','deploy','ci','neural','model','train','api'],
  data: ['analyze','query','search','index','corpus','dataset','benchmark','spreadsheet','database'],
  communication: ['discord','slack','email','telegram','message','notify','send','chat','conversation'],
  science: ['chemistry','phi','math','validate','synthesize','reaction','fibonacci','ratio','molecule']
};

// ─── CONFIG ──────────────────────────────────────────────────────────────────

let _cachedConfig = null;
function getConfig() {
  if (_cachedConfig) return _cachedConfig;
  try {
    _cachedConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  } catch {
    _cachedConfig = { maxTools: 7, minThreshold: 0.15, tokenBudget: 8700, toolTokenEstimate: 1200 };
  }
  return _cachedConfig;
}

// ─── CAPABILITY INDEX ────────────────────────────────────────────────────────

let _cachedIndex = null;
let _indexMtime = 0;

function getIndex() {
  try {
    const stat = fs.statSync(CAPABILITY_PATH);
    if (stat.mtimeMs !== _indexMtime || !_cachedIndex) {
      _cachedIndex = JSON.parse(fs.readFileSync(CAPABILITY_PATH, 'utf8'));
      _indexMtime = stat.mtimeMs;
    }
    return _cachedIndex;
  } catch {
    return { tools: [] };
  }
}

// ─── ENCODER ─────────────────────────────────────────────────────────────────

function encodeIntent(message) {
  const lower = message.toLowerCase();
  const words = lower.split(/[\s\-_,.()[\]{}]+/).filter(w => w.length > 2);

  let primaryIntent = 'general', intentScore = 0;
  for (const [intent, keywords] of Object.entries(INTENT_PATTERNS)) {
    let mc = 0;
    for (const k of keywords) if (lower.includes(k)) mc++;
    if (mc > intentScore) { intentScore = mc; primaryIntent = intent; }
  }

  // First-word boost
  if (words[0]) {
    for (const [intent, keywords] of Object.entries(INTENT_PATTERNS)) {
      if (keywords.includes(words[0])) { primaryIntent = intent; break; }
    }
  }

  let primaryDomain = 'general', domainScore = 0;
  for (const [domain, keywords] of Object.entries(DOMAINS)) {
    let mc = 0;
    for (const k of keywords) if (lower.includes(k)) mc++;
    if (mc > domainScore) { domainScore = mc; primaryDomain = domain; }
  }

  // Plugin creation/deployment → development domain
  const rawWords = words;
  if (rawWords.some(w => w === 'plugin' || w === 'plugins') && ['create','deploy','configure'].includes(primaryIntent)) {
    primaryDomain = 'development';
  }

  const keywords = words.filter(w => !STOPWORDS.has(w));
  return { primaryIntent, primaryDomain, keywords, rawKeywords: words, raw: message };
}

// ─── SELECTOR ────────────────────────────────────────────────────────────────

function scoreTools(intent, tools, config) {
  const results = [];
  const minThreshold = config.minThreshold || 0.15;

  for (const tool of tools) {
    if (!tool) continue;
    let score = 0;
    const rationale = [];

    const toolKeywords = tool.keywords || [];
    if (!Array.isArray(toolKeywords)) continue;

    // 1. Filtered keyword overlap (0-0.5)
    const overlap = intent.keywords.filter(k => toolKeywords.includes(k));
    if (overlap.length > 0) {
      score += (overlap.length / Math.max(intent.keywords.length, 1)) * 0.5;
      overlap.slice(0, 3).forEach(k => rationale.push('kw:' + k));
    }

    // 2. Raw keyword overlap (catches domain-critical words)
    const rawOverlap = (intent.rawKeywords || []).filter(k => toolKeywords.includes(k));
    if (rawOverlap.length > overlap.length) {
      score += Math.min((rawOverlap.length - overlap.length) * 0.08, 0.3);
    }

    // 3. Domain match (+0.15)
    if (tool.domain === intent.primaryDomain && intent.primaryDomain !== 'general') {
      score += 0.15;
      rationale.push('dom:' + intent.primaryDomain);
    }

    // 4. Intent match (+0.2)
    if (Array.isArray(tool.intents) && tool.intents.includes(intent.primaryIntent) && intent.primaryIntent !== 'general') {
      score += 0.2;
      rationale.push('int:' + intent.primaryIntent);
    }

    // 5. Description match (0-0.3)
    if (tool.description) {
      const dw = tool.description.toLowerCase().split(/[\s\-_,.()[\]{}]+/);
      const dO = (intent.rawKeywords || []).filter(k => dw.includes(k));
      if (dO.length > 0) {
        score += Math.min((dO.length / dw.length) * 0.3, 0.3);
        dO.slice(0, 2).forEach(k => rationale.push('d:' + k));
      }
    }

    // 6. Title match (+0.1 per word)
    if (tool.title) {
      const tw = tool.title.toLowerCase().split(/[\s\-_,.()[\]{}]+/);
      const tO = (intent.rawKeywords || []).filter(k => tw.includes(k));
      if (tO.length > 0) {
        score += 0.1 * tO.length;
        rationale.push('title:' + tO[0]);
      }
    }

    // 7. Plugin name match (+0.05 per word)
    if (tool.plugin && typeof tool.plugin === 'string') {
      const pw = tool.plugin.toLowerCase().split(/[\s\-_]+/);
      const pO = (intent.rawKeywords || []).filter(k => pw.includes(k));
      if (pO.length > 0) score += 0.05 * pO.length;
    }

    score = Math.min(score, 1.0);

    if (score >= minThreshold) {
      results.push({
        tool: tool.name,
        score: parseFloat(score.toFixed(3)),
        rationale: rationale.slice(0, 5).join(' | '),
        domain: tool.domain || 'general',
        category: tool.category || 'general',
        plugin: tool.plugin || 'native',
        title: tool.title || tool.name
      });
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results;
}

// ─── DECODE SCHEMAS ──────────────────────────────────────────────────────────

function mapSchemas(rankedTools, allSchemas) {
  const map = new Map();
  for (const s of allSchemas) {
    const name = s.function?.name || s.name;
    if (name) map.set(name, s);
  }
  return rankedTools
    .map(r => ({ schema: map.get(r.tool), score: r.score, rationale: r.rationale, domain: r.domain }))
    .filter(r => r.schema);
}

// ─── LOG SELECTIONS ──────────────────────────────────────────────────────────

function logSelection(message, ranked) {
  try {
    let log = [];
    try { log = JSON.parse(fs.readFileSync(LOG_PATH, 'utf8')); } catch {}
    log.push({
      ts: new Date().toISOString(),
      message: message.substring(0, 120),
      selected: ranked.slice(0, 8).map(r => ({ tool: r.tool, score: r.score })),
      tokenEstimate: ranked.slice(0, 8).length * 1200
    });
    if (log.length > 500) log = log.slice(-500);
    fs.writeFileSync(LOG_PATH, JSON.stringify(log, null, 2));
  } catch {}
}

// ─── MAIN: codecSelectTools ──────────────────────────────────────────────────

function codecSelectTools(userMessage, allSchemas, options = {}) {
  try {
    const config = getConfig();
    const maxTools = options.maxTools || config.maxTools || 7;
    const intent = encodeIntent(userMessage);
    const index = getIndex();
    const ranked = scoreTools(intent, index.tools || [], config);
    const withSchemas = mapSchemas(ranked, allSchemas).slice(0, maxTools);

    const selectedNames = new Set(withSchemas.map(r => r.schema?.function?.name || r.schema?.name));
    const fallbacks = (config.fallbackTools || ['execute_javascript_code', 'web_search', 'file_operations'])
      .filter(f => !selectedNames.has(f));

    const perTool = config.toolTokenEstimate || 1200;
    const staticTokens = (allSchemas.length || 40) * perTool;
    const dynamicTokens = withSchemas.length * perTool;

    const stats = {
      totalAvailable: allSchemas.length || 0,
      indexed: index.tools?.length || 0,
      selected: withSchemas.length,
      intent: intent.primaryIntent,
      domain: intent.primaryDomain,
      keywords: intent.keywords.length,
      staticTokens,
      dynamicTokens,
      savings: staticTokens > 0 ? Math.round((1 - dynamicTokens / staticTokens) * 100) : 0,
      tokenBudgetUsed: Math.round((dynamicTokens / (config.tokenBudget || 8700)) * 100)
    };

    if (options.log !== false) logSelection(userMessage, ranked);

    return { ranked: withSchemas, fallbacks, stats, intent };
  } catch (e) {
    return { ranked: [], fallbacks: ['execute_javascript_code', 'web_search', 'file_operations'], stats: null, intent: null, error: e.message };
  }
}

module.exports = { codecSelectTools, encodeIntent, scoreTools, getIndex, getConfig };
