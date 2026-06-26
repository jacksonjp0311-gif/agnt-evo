function asBool(v) {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  if (typeof v === 'string') return ['true', '1', 'yes', 'on'].includes(v.trim().toLowerCase());
  return false;
}

function normalizeUrl(raw) {
  const url = String(raw || '').trim();
  if (!url) throw new Error('url is required');

  // Allow common safe schemes. (We can expand later if needed.)
  const lower = url.toLowerCase();
  const ok =
    lower.startsWith('http://') ||
    lower.startsWith('https://') ||
    lower.startsWith('file:///') ||
    lower.startsWith('mailto:');

  if (!ok) {
    throw new Error('Unsupported URL scheme. Use http(s)://, file:///, or mailto:.');
  }

  return url;
}

class OpenUrl {
  constructor() {
    this.name = 'open-url';
  }

  async execute(params) {
    try {
      const url = normalizeUrl(params?.url);
      const embed = asBool(params?.embed ?? true);
      const height = Math.max(200, Math.min(2000, Number(params?.height ?? 720)));
      const width = String(params?.width ?? '100%');

      const markdown = `URL: ${url}`;
      const iframeHtml = embed
        ? `<iframe src="${url}" style="width:${width}; height:${height}px; border:1px solid rgba(255,255,255,0.12); border-radius:16px;"></iframe>`
        : '';

      return {
        success: true,
        url,
        markdown,
        iframeHtml,
        error: '',
      };
    } catch (error) {
      return { success: false, error: error?.message || String(error) };
    }
  }
}

export default new OpenUrl();
