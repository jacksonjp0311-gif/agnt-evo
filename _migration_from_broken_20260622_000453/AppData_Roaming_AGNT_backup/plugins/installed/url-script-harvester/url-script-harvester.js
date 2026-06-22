import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

function asBool(v) {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  if (typeof v === 'string') return ['true', '1', 'yes', 'on'].includes(v.trim().toLowerCase());
  return false;
}

function asInt(v, def, min, max) {
  const n = Number.parseInt(String(v ?? def), 10);
  if (Number.isNaN(n)) return def;
  return Math.max(min, Math.min(max, n));
}

function sha256(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

function getUserDataPath() {
  return process.env.USER_DATA_PATH || process.cwd();
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function extractCspFromMeta(html) {
  const meta = [];
  const re = /<meta\s+[^>]*http-equiv=["']Content-Security-Policy["'][^>]*>/gi;
  let m;
  while ((m = re.exec(html))) {
    const tag = m[0];
    const cm = /content=["']([^"']+)["']/i.exec(tag);
    if (cm) meta.push(cm[1]);
  }
  return meta;
}

function extractScriptTags(html) {
  const scripts = [];
  const inline = [];

  // External scripts
  const reSrc = /<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>(?:<\/script>)?/gi;
  let m;
  while ((m = reSrc.exec(html))) {
    scripts.push({ src: m[1] });
  }

  // Inline blocks (non-src)
  const reInline = /<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;
  while ((m = reInline.exec(html))) {
    const code = (m[1] || '').trim();
    if (code) inline.push(code);
  }

  return { scripts, inline };
}

function unique(arr) {
  return [...new Set(arr.filter(Boolean))];
}

function analyzeJs(code) {
  const findings = {
    injection: {
      createElementScript: /createElement\(\s*['"]script['"]\s*\)/i.test(code),
      appendChild: /appendChild\s*\(/i.test(code),
      insertBefore: /insertBefore\s*\(/i.test(code),
      documentWriteScript: /document\.write\s*\(\s*['"`][\s\S]*<script/i.test(code),
      setAttributeSrc: /setAttribute\(\s*['"]src['"]/i.test(code),
      eval: /\beval\s*\(/i.test(code),
      functionCtor: /new\s+Function\s*\(/i.test(code),
      setTimeoutString: /setTimeout\(\s*['"`]/i.test(code),
      atob: /\batob\s*\(/i.test(code),
    },
    network: {
      fetchCalls: [],
      axiosCalls: [],
      wsUrls: [],
      absoluteUrls: [],
      apiPaths: [],
      graphqlHints: /graphql/i.test(code),
    },
    storageKeys: [],
  };

  // Absolute URLs
  const abs = code.match(/https?:\/\/[^\s"'`<>]+/g) || [];
  findings.network.absoluteUrls = unique(abs);

  // /api paths
  const apis = code.match(/\/(api|v\d+\/api)\/[A-Za-z0-9_\-\/\.]+/g) || [];
  findings.network.apiPaths = unique(apis);

  // WebSocket
  const ws = code.match(/wss?:\/\/[^\s"'`<>]+/g) || [];
  findings.network.wsUrls = unique(ws);

  // fetch('...')
  const fetchRe = /fetch\(\s*(["'`])([^\1\n\r]+?)\1/gi;
  let m;
  while ((m = fetchRe.exec(code))) {
    findings.network.fetchCalls.push(m[2]);
  }
  findings.network.fetchCalls = unique(findings.network.fetchCalls);

  // axios.get/post('...')
  const axiosRe = /axios\.(get|post|put|patch|delete)\(\s*(["'`])([^\2\n\r]+?)\2/gi;
  while ((m = axiosRe.exec(code))) {
    findings.network.axiosCalls.push({ method: m[1], url: m[3] });
  }

  // localStorage/sessionStorage key extraction
  const lsRe = /(localStorage|sessionStorage)\.(getItem|setItem|removeItem)\(\s*(["'`])([^\3\n\r]+?)\3/gi;
  while ((m = lsRe.exec(code))) {
    findings.storageKeys.push(m[4]);
  }
  findings.storageKeys = unique(findings.storageKeys);

  return findings;
}

function scoreInjection(inj) {
  const weights = {
    createElementScript: 2,
    setAttributeSrc: 2,
    appendChild: 1,
    insertBefore: 1,
    documentWriteScript: 4,
    eval: 5,
    functionCtor: 5,
    setTimeoutString: 3,
    atob: 2,
  };
  let score = 0;
  for (const [k, w] of Object.entries(weights)) {
    if (inj[k]) score += w;
  }
  return score;
}

function summarizeInjection(inj) {
  const hits = Object.entries(inj)
    .filter(([, v]) => v)
    .map(([k]) => k);
  return { hits, score: scoreInjection(inj) };
}

function buildPluginIdeas({ endpoints, hasGraphQL, injectionScore }) {
  const ideas = [];
  if (endpoints.some((e) => String(e).includes('/graphql')) || hasGraphQL) {
    ideas.push({
      title: 'GraphQL Explorer Tool',
      why: 'Detected GraphQL usage. Consider a tool that can introspect schema and run saved queries with auth.',
      suggestedTools: ['graphql-introspect', 'graphql-query'],
    });
  }

  const apiish = endpoints.filter((e) => String(e).includes('/api/') || String(e).startsWith('/api'));
  if (apiish.length) {
    ideas.push({
      title: 'API Wrapper Plugin',
      why: `Detected ${apiish.length} API-like endpoints. Consider wrapping top endpoints as AGNT workflow actions.`,
      endpoints: apiish.slice(0, 20),
    });
  }

  if (injectionScore >= 6) {
    ideas.push({
      title: 'Runtime Script Injection Guard',
      why: 'High runtime-injection pattern score. Consider adding CSP validation checks or integrity pinning in your app.',
      suggestedTools: ['csp-auditor', 'sri-checker'],
    });
  }

  if (!ideas.length) {
    ideas.push({
      title: 'Site Capability Mapper',
      why: 'No obvious API patterns detected; consider a generic tool to map routes, forms, and visible UI actions.',
    });
  }

  return ideas;
}

class UrlScriptHarvester {
  constructor() {
    this.name = 'url-script-harvester';
  }

  async execute(params, inputData, workflowEngine) {
    try {
      const url = String(params?.url || '').trim();
      if (!url) return { success: false, error: 'url is required' };

      const maxScripts = asInt(params?.maxScripts, 30, 1, 200);
      const includeInlineScripts = asBool(params?.includeInlineScripts);
      const maxScriptBytes = asInt(params?.maxScriptBytes, 800000, 10000, 5000000);
      const timeoutSeconds = asInt(params?.timeoutSeconds, 30, 5, 180);
      const userAgent = String(params?.userAgent || 'AGNT-URL-Script-Harvester/0.1.0');
      const writeReport = asBool(params?.writeReport);

      const abort = new AbortController();
      const t = setTimeout(() => abort.abort(), timeoutSeconds * 1000);
      const res = await fetch(url, { headers: { 'User-Agent': userAgent }, redirect: 'follow', signal: abort.signal });
      clearTimeout(t);

      const status = res.status;
      const finalUrl = res.url;
      const html = await res.text();

      const cspHeader = res.headers.get('content-security-policy');
      const cspMeta = extractCspFromMeta(html);

      const { scripts, inline } = extractScriptTags(html);
      const scriptUrls = unique(scripts.map((s) => {
        try { return new URL(s.src, finalUrl).toString(); } catch { return null; }
      })).slice(0, maxScripts);

      const scriptsOut = [];
      const endpoints = [];
      const storageKeys = [];
      let hasGraphQL = false;
      let injectionScoreTotal = 0;
      const injectionHitCounts = {};

      for (const sUrl of scriptUrls) {
        const ctrl = new AbortController();
        const tt = setTimeout(() => ctrl.abort(), timeoutSeconds * 1000);
        let sRes;
        try {
          sRes = await fetch(sUrl, { headers: { 'User-Agent': userAgent }, redirect: 'follow', signal: ctrl.signal });
        } finally {
          clearTimeout(tt);
        }
        if (!sRes || !sRes.ok) {
          scriptsOut.push({ url: sUrl, fetched: false, status: sRes?.status ?? null, error: 'fetch failed' });
          continue;
        }

        let text = await sRes.text();
        const truncated = text.length > maxScriptBytes;
        if (truncated) text = text.slice(0, maxScriptBytes);

        const analysis = analyzeJs(text);
        const injSummary = summarizeInjection(analysis.injection);
        injectionScoreTotal += injSummary.score;
        for (const k of injSummary.hits) injectionHitCounts[k] = (injectionHitCounts[k] || 0) + 1;

        hasGraphQL = hasGraphQL || analysis.network.graphqlHints;

        endpoints.push(...analysis.network.absoluteUrls);
        endpoints.push(...analysis.network.wsUrls);
        endpoints.push(...analysis.network.fetchCalls);
        endpoints.push(...analysis.network.apiPaths);
        endpoints.push(...analysis.network.axiosCalls.map((x) => x.url));

        storageKeys.push(...analysis.storageKeys);

        scriptsOut.push({
          url: sUrl,
          fetched: true,
          status: sRes.status,
          bytes: text.length,
          truncated,
          sha256: sha256(text),
          injection: injSummary,
          graphqlHints: analysis.network.graphqlHints,
          endpointsSample: unique([...
            analysis.network.fetchCalls,
            ...analysis.network.apiPaths,
            ...analysis.network.wsUrls,
            ...analysis.network.absoluteUrls,
          ]).slice(0, 20)
        });
      }

      const inlineOut = [];
      if (includeInlineScripts) {
        for (let i = 0; i < inline.length; i++) {
          const code = inline[i];
          const analysis = analyzeJs(code);
          const injSummary = summarizeInjection(analysis.injection);
          injectionScoreTotal += injSummary.score;
          for (const k of injSummary.hits) injectionHitCounts[k] = (injectionHitCounts[k] || 0) + 1;
          hasGraphQL = hasGraphQL || analysis.network.graphqlHints;
          endpoints.push(...analysis.network.absoluteUrls);
          endpoints.push(...analysis.network.wsUrls);
          endpoints.push(...analysis.network.fetchCalls);
          endpoints.push(...analysis.network.apiPaths);
          endpoints.push(...analysis.network.axiosCalls.map((x) => x.url));
          storageKeys.push(...analysis.storageKeys);
          inlineOut.push({
            index: i,
            bytes: code.length,
            sha256: sha256(code),
            injection: injSummary,
            endpointsSample: unique([...
              analysis.network.fetchCalls,
              ...analysis.network.apiPaths,
              ...analysis.network.wsUrls,
              ...analysis.network.absoluteUrls,
            ]).slice(0, 20)
          });
        }
      }

      const endpointsOut = unique(endpoints.map(String)).slice(0, 500);
      const storageOut = unique(storageKeys.map(String)).slice(0, 500);

      const runtimeInjectionFindings = {
        totalInjectionScore: injectionScoreTotal,
        hitCounts: injectionHitCounts,
        heuristic: {
          level: injectionScoreTotal >= 12 ? 'high' : injectionScoreTotal >= 6 ? 'medium' : 'low',
          meaning:
            'Heuristic score based on common runtime script injection patterns (eval, Function, document.write, script element injection). This is not a proof of exploitability; it highlights areas to review.'
        }
      };

      const pluginIdeas = buildPluginIdeas({ endpoints: endpointsOut, hasGraphQL, injectionScore: injectionScoreTotal });

      const out = {
        success: true,
        finalUrl,
        status,
        csp: { header: cspHeader || '', meta: cspMeta },
        scripts: scriptsOut,
        inlineScripts: inlineOut,
        runtimeInjectionFindings,
        endpoints: endpointsOut,
        storageKeys: storageOut,
        pluginIdeas,
        reportPath: '',
        error: ''
      };

      if (writeReport) {
        const userId = workflowEngine?.userId || 'default';
        const root = path.join(getUserDataPath(), 'plugin-data', 'url-script-harvester', String(userId), 'reports');
        ensureDir(root);
        const stamp = new Date().toISOString().replace(/[:.]/g, '-');
        const reportPath = path.join(root, `report-${stamp}.json`);
        fs.writeFileSync(reportPath, JSON.stringify(out, null, 2));
        out.reportPath = reportPath;
      }

      return out;
    } catch (error) {
      return { success: false, error: error?.message || String(error) };
    }
  }
}

export default new UrlScriptHarvester();
