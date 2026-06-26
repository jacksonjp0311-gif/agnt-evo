/**
 * Tool: swarm-workload
 * Category: action
 * Single bounded workload runner — fetch/scrape one URL with full metadata.
 */

function asNumber(v, def, min, max) {
  const n = Number(v);
  if (isNaN(n)) return def;
  return Math.max(min, Math.min(max, n));
}

function asString(v, def) {
  if (v === undefined || v === null) return def;
  return String(v).trim() || def;
}

function stripHtml(html, maxChars = 5000) {
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

function extractLinks(html, baseUrl, maxLinks = 20) {
  const links = [];
  const regex = /<a[^>]*href=["']([^"']*?)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = regex.exec(html)) && links.length < maxLinks) {
    const href = match[1];
    const text = match[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
      let absoluteUrl;
      try {
        absoluteUrl = new URL(href, baseUrl).href;
      } catch {
        absoluteUrl = href;
      }
      links.push({ href: absoluteUrl, text: text.slice(0, 100) });
    }
  }
  return links;
}

function extractHeadings(html) {
  const headings = [];
  for (let level = 1; level <= 6; level++) {
    const regex = new RegExp(`<h${level}[^>]*>([\\s\\S]*?)<\\/h${level}>`, 'gi');
    let match;
    while ((match = regex.exec(html)) && headings.length < 30) {
      const text = match[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
      if (text) headings.push({ level, text: text.slice(0, 200) });
    }
  }
  return headings;
}

class SwarmWorkload {
  constructor() {
    this.name = 'swarm-workload';
  }

  async execute(params) {
    const startTime = Date.now();

    try {
      const url = asString(params?.url, '');
      if (!url) {
        return { success: false, content: '', bytes: 0, title: '', error: 'url is required', elapsedMs: 0 };
      }

      // Validate URL
      const lower = url.toLowerCase();
      if (!lower.startsWith('http://') && !lower.startsWith('https://')) {
        return { success: false, content: '', bytes: 0, title: '', error: 'URL must start with http:// or https://', elapsedMs: 0 };
      }

      const timeoutMs = asNumber(params?.timeout, 15, 1, 120) * 1000;
      const maxBytes = asNumber(params?.maxBytes, 250000, 1024, 10000000);
      const extractMode = asString(params?.extractMode ?? params?.extract_mode, 'text'); // text, html, links, headings, all

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      let response;
      try {
        response = await fetch(url, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'identity',
          },
          redirect: 'follow',
        });
      } catch (fetchError) {
        clearTimeout(timer);
        return {
          success: false,
          content: '',
          bytes: 0,
          title: '',
          status: 0,
          error: fetchError?.message || String(fetchError),
          elapsedMs: Date.now() - startTime,
        };
      }

      clearTimeout(timer);

      // Read response body (truncated to maxBytes)
      const rawText = await response.text();
      const totalBytes = Buffer.byteLength(rawText, 'utf8');
      const truncated = totalBytes > maxBytes;
      const html = truncated ? rawText.slice(0, Math.floor(maxBytes / 2)) : rawText; // rough char estimate

      const title = extractTitle(html);
      const metaDescription = extractMetaDescription(html);
      const elapsedMs = Date.now() - startTime;

      // Build output based on extract mode
      let content = '';
      const metadata = {
        url: response.url,
        status: response.status,
        statusText: response.statusText,
        contentType: response.headers.get('content-type') || '',
        totalBytes,
        truncated,
        title,
        metaDescription,
        elapsedMs,
      };

      switch (extractMode) {
        case 'text':
          content = stripHtml(html, 5000);
          break;
        case 'html':
          content = html.slice(0, maxBytes);
          break;
        case 'links':
          content = JSON.stringify(extractLinks(html, response.url), null, 2);
          break;
        case 'headings':
          content = JSON.stringify(extractHeadings(html), null, 2);
          break;
        case 'all':
        default: {
          const text = stripHtml(html, 3000);
          const links = extractLinks(html, response.url, 10);
          const headings = extractHeadings(html);
          content = JSON.stringify({ text, links, headings }, null, 2);
          break;
        }
      }

      return {
        success: true,
        content,
        bytes: Buffer.byteLength(content, 'utf8'),
        title,
        status: response.status,
        metadata,
        error: '',
        elapsedMs,
      };
    } catch (error) {
      return {
        success: false,
        content: '',
        bytes: 0,
        title: '',
        status: 0,
        error: error?.message || String(error),
        elapsedMs: Date.now() - startTime,
      };
    }
  }
}

export default new SwarmWorkload();
