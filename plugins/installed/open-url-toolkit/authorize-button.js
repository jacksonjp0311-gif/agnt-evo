function asBool(v) {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  if (typeof v === 'string') return ['true', '1', 'yes', 'on'].includes(v.trim().toLowerCase());
  return false;
}

function safeJsonParse(v) {
  if (v == null) return null;
  if (typeof v === 'object') return v;
  const s = String(v).trim();
  if (!s) return null;
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

function normalizeUrl(raw) {
  const url = String(raw || '').trim();
  if (!url) throw new Error('webhookUrl is required');
  const lower = url.toLowerCase();
  const ok = lower.startsWith('http://') || lower.startsWith('https://');
  if (!ok) throw new Error('authorize-button only supports http(s) webhook URLs');
  return url;
}

class AuthorizeButton {
  constructor() {
    this.name = 'authorize-button';
  }

  async execute(params) {
    try {
      const webhookUrl = normalizeUrl(params?.webhookUrl);
      const buttonText = String(params?.buttonText || 'Authorize & Continue');
      const description = String(params?.description || '').trim();
      const payload = safeJsonParse(params?.payloadJson) || {};
      const openAfter = asBool(params?.openAfter ?? false);
      const openUrl = openAfter ? String(params?.openUrl || '').trim() : '';

      const markdown = [
        description ? description : 'Authorization required.',
        `Webhook: ${webhookUrl}`
      ].filter(Boolean).join('\n');

      // A self-contained, click-to-authorize widget.
      const html = `
<div style="display:flex; flex-direction:column; gap:12px; padding:16px; border:1px solid rgba(255,255,255,0.12); border-radius:16px; background: rgba(0,0,0,0.15);">
  <div style="font-family: system-ui; color: rgba(255,255,255,0.85); line-height: 1.4;">
    <div style="font-size:14px; opacity:0.9;">${description ? description.replace(/</g,'&lt;') : 'Authorization required to proceed.'}</div>
    <div style="font-size:12px; opacity:0.6; margin-top:6px; word-break:break-all;">${webhookUrl}</div>
  </div>
  <div style="display:flex; gap:12px; align-items:center;">
    <button id="authBtn" style="background:#19ef83; color:#0b0b12; border:none; padding:10px 14px; border-radius:12px; font-weight:700; cursor:pointer;">${buttonText.replace(/</g,'&lt;')}</button>
    <div id="authStatus" style="font-family: system-ui; font-size:12px; color: rgba(255,255,255,0.75);"></div>
  </div>
</div>
<script>
(async function(){
  const btn = document.getElementById('authBtn');
  const status = document.getElementById('authStatus');
  const payload = ${JSON.stringify(payload)};
  btn.addEventListener('click', async () => {
    status.textContent = 'Sending authorization...';
    btn.disabled = true;
    try {
      const r = await fetch(${JSON.stringify(webhookUrl)}, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const txt = await r.text();
      status.textContent = 'Authorized ✓ (HTTP ' + r.status + ')';
      if (${openAfter ? 'true' : 'false'} && ${JSON.stringify(openUrl)} ) {
        window.open(${JSON.stringify(openUrl)}, '_blank');
      }
      console.log('authorize-button response:', txt);
    } catch (e) {
      status.textContent = 'Failed: ' + (e && e.message ? e.message : String(e));
      btn.disabled = false;
    }
  });
})();
</script>`;

      return {
        success: true,
        webhookUrl,
        markdown,
        html,
        error: ''
      };
    } catch (error) {
      return { success: false, error: error?.message || String(error) };
    }
  }
}

export default new AuthorizeButton();
