function asBool(v) {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  if (typeof v === 'string') return ['true', '1', 'yes', 'on'].includes(v.trim().toLowerCase());
  return false;
}

function escHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeHttpUrl(raw) {
  const u = String(raw || '').trim();
  if (!u) return '';
  const lower = u.toLowerCase();
  if (!(lower.startsWith('http://') || lower.startsWith('https://'))) {
    throw new Error('Webhook URLs must be http(s)://');
  }
  return u;
}

class ChatActionsStrip {
  constructor() {
    this.name = 'chat-actions-strip';
  }

  async execute(params) {
    try {
      // AGNT execute endpoint wraps body in { args: {...} }.
      // Support both { args: {...} } and flat {...} for robustness.
      const args = (params && typeof params === 'object' && 'args' in params && params.args && typeof params.args === 'object')
        ? params.args
        : params || {};

      const content = String(args?.content ?? '');
      const regeneratePrompt = String(args?.regeneratePrompt ?? 'Regenerate your last response.');
      const shareWebhookUrl = normalizeHttpUrl(args?.shareWebhookUrl);
      const feedbackWebhookUrl = normalizeHttpUrl(args?.feedbackWebhookUrl);
      const showFeedback = asBool(args?.showFeedback ?? true);
      const density = String(args?.density ?? 'compact') === 'comfortable' ? 'comfortable' : 'compact';
      const hint = String(args?.hint ?? '').trim();

      // Unique IDs so multiple strips can exist in one chat.
      const uid = 'agnt_actions_' + Math.random().toString(36).slice(2, 10);

      const palette = {
        cyan: 'var(--color-blue, var(--color-primary, #12e0ff))',
        pink: 'var(--color-pink, #e53d8f)',
        green: 'var(--color-green, #19ef83)',
        gold: 'var(--color-yellow, #ffd700)',
        violet: 'var(--color-violet, var(--color-secondary, #7d3de5))'
      };

      const html = `
<div id="${uid}_wrap" class="agntChatActionsWrap">
  <div id="${uid}" class="agntChatActions" data-density="${density}">
  <button class="btn" data-accent="cyan" data-action="regen" title="Regenerate" aria-label="Regenerate">
    <span class="i">${ICON_REGEN}</span>
  </button>
  <button class="btn" data-accent="pink" data-action="copy" title="Copy" aria-label="Copy">
    <span class="i">${ICON_COPY}</span>
  </button>
  <button class="btn" data-accent="green" data-action="share" title="Share / Upload" aria-label="Share">
    <span class="i">${ICON_UPLOAD}</span>
  </button>

  ${showFeedback ? `
  <span class="sep" aria-hidden="true"></span>
  <button class="btn" data-accent="gold" data-action="up" title="Thumbs up" aria-label="Thumbs up">
    <span class="i">${ICON_THUMB_UP}</span>
  </button>
  <button class="btn" data-accent="violet" data-action="down" title="Thumbs down" aria-label="Thumbs down">
    <span class="i">${ICON_THUMB_DOWN}</span>
  </button>
  ` : ''}

  <span class="spacer"></span>
  <span class="hint">${escHtml(hint)}</span>
  <span class="status" aria-live="polite"></span>

  <style>
    /* Theme-aware translucent strip that darkens on hover */
    #${uid}_wrap.agntChatActionsWrap{
      width: 100%;
      display: flex;
      justify-content: flex-start;
      margin-top: 8px;
    }

    #${uid}.agntChatActions{
      --bg-rgb: var(--color-background-rgb, 11, 15, 26);
      --text: var(--color-text, rgba(255,255,255,0.88));
      --muted: var(--color-text-muted, rgba(255,255,255,0.62));

      --strip-a: 0.22;
      --strip-hover-a: 0.40;
      --btn-hover-a: 0.10;
      --btn-active-a: 0.16;

      display: inline-flex;
      align-items: center;
      gap: 8px;
      max-width: 100%;
      flex-wrap: wrap;

      padding: ${density === 'comfortable' ? '10px 12px' : '8px 10px'};
      border-radius: 14px;

      /* Futuristic: translucent glass + subtle gradient edge */
      background: linear-gradient(180deg,
        rgba(var(--bg-rgb), calc(var(--strip-a) + 0.04)),
        rgba(var(--bg-rgb), var(--strip-a))
      );
      border: 1px solid rgba(255,255,255,0.08);
      box-shadow:
        0 10px 30px rgba(0,0,0,0.25),
        0 0 0 1px rgba(255,255,255,0.03) inset;

      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);

      transition: background 140ms ease, border-color 140ms ease, box-shadow 140ms ease;
      position: relative;
      overflow: hidden;
    }

    /* Neon hairline sweep */
    #${uid}.agntChatActions::after{
      content:"";
      position:absolute;
      inset: 0;
      pointer-events:none;
      background: radial-gradient(800px 120px at 10% 0%, rgba(18,224,255,0.12), transparent 60%),
                  radial-gradient(700px 140px at 90% 100%, rgba(229,61,143,0.10), transparent 65%);
      opacity: 0.9;
      mix-blend-mode: screen;
    }

    #${uid}.agntChatActions:hover{
      background: rgba(var(--bg-rgb), var(--strip-hover-a));
      border-color: rgba(255,255,255,0.10);
    }

    #${uid} .btn{
      width: ${density === 'comfortable' ? '34px' : '32px'};
      height: ${density === 'comfortable' ? '30px' : '28px'};
      border-radius: 10px;
      border: 1px solid transparent;
      background: transparent;
      color: var(--muted);
      cursor: pointer;
      padding: 0;
      position: relative;
      outline: none;
      transition: transform 120ms ease, background 120ms ease, border-color 120ms ease, color 120ms ease;
    }

    #${uid} .btn:hover{
      background: rgba(255,255,255,var(--btn-hover-a));
      border-color: rgba(255,255,255,0.08);
      color: rgba(255,255,255,0.92);
      transform: translateY(-1px);
    }

    #${uid} .btn:active{
      background: rgba(255,255,255,var(--btn-active-a));
      transform: translateY(0px) scale(0.98);
    }

    #${uid} .btn:focus-visible{
      border-color: rgba(255,255,255,0.16);
      box-shadow: 0 0 0 3px rgba(18,224,255,0.14);
    }

    #${uid} .btn::before{
      content:"";
      position:absolute;
      inset: -10px;
      border-radius: 14px;
      background: radial-gradient(circle at 50% 50%, var(--accent) 0%, transparent 55%);
      opacity: 0;
      filter: blur(10px);
      transition: opacity 140ms ease;
      pointer-events: none;
    }

    #${uid} .btn:hover::before{ opacity: 0.22; }

    #${uid} .btn[data-accent="cyan"]{ --accent: ${palette.cyan}; }
    #${uid} .btn[data-accent="pink"]{ --accent: ${palette.pink}; }
    #${uid} .btn[data-accent="green"]{ --accent: ${palette.green}; }
    #${uid} .btn[data-accent="gold"]{ --accent: ${palette.gold}; }
    #${uid} .btn[data-accent="violet"]{ --accent: ${palette.violet}; }

    #${uid} .btn[data-accent]:hover{
      /* soft accent tint on hover */
      color: color-mix(in srgb, white 70%, var(--accent) 30%);
    }

    #${uid} .i{ display:grid; place-items:center; width:100%; height:100%; }
    #${uid} svg{ width: 18px; height: 18px; }

    #${uid} .sep{
      width: 10px;
      height: 18px;
      border-left: 1px solid rgba(255,255,255,0.10);
      margin: 0 2px;
      opacity: 0.9;
    }

    #${uid} .spacer{ flex: 1; }

    #${uid} .hint{
      font-family: system-ui;
      font-size: 12px;
      color: var(--muted);
      margin-right: 6px;
      user-select: none;
    }

    #${uid} .status{
      font-family: system-ui;
      font-size: 12px;
      color: rgba(255,255,255,0.78);
      user-select: none;
      min-height: 14px;
    }
  </style>

  <script>
  (function(){
    const root = document.getElementById(${JSON.stringify(uid)});
    if (!root) return;

    const status = root.querySelector('.status');

    const content = ${JSON.stringify(content)};
    const regenPrompt = ${JSON.stringify(regeneratePrompt)};
    const shareWebhookUrl = ${JSON.stringify(shareWebhookUrl)};
    const feedbackWebhookUrl = ${JSON.stringify(feedbackWebhookUrl)};

    function setStatus(msg){ if (status) status.textContent = msg || ''; }

    async function copyText(txt){
      const text = String(txt || '');
      if (!text) throw new Error('Nothing to copy');
      await navigator.clipboard.writeText(text);
    }

    async function postJson(url, body){
      if (!url) throw new Error('No webhook URL configured');

      const isApiPath = String(url).startsWith('/api');

      // For AGNT internal API calls, use the global SDK (token is proxied securely).
      if (isApiPath && window.agnt && typeof window.agnt.fetch === 'function') {
        return await window.agnt.fetch(url, { method: 'POST', body });
      }

      // For external webhooks, use normal fetch.
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const t = await r.text();
      return { status: r.status, text: t };
    }

    root.addEventListener('click', async (e) => {
      const btn = e.target && e.target.closest ? e.target.closest('button[data-action]') : null;
      if (!btn) return;

      const action = btn.getAttribute('data-action');
      try {
        setStatus('');

        if (action === 'regen') {
          await copyText(regenPrompt);
          setStatus('Regenerate prompt copied');
          return;
        }

        if (action === 'copy') {
          await copyText(content || regenPrompt);
          setStatus('Copied');
          return;
        }

        if (action === 'share') {
          const payload = { content: content || '', meta: { source: 'chat-actions-strip', ts: Date.now() } };
          if (shareWebhookUrl) {
            await postJson(shareWebhookUrl, payload);
            setStatus('Uploaded');
            return;
          }

          // Fallback: attempt Web Share, else copy content.
          if (navigator.share) {
            await navigator.share({ title: 'AGNT Output', text: (content || regenPrompt).slice(0, 4000) });
            setStatus('Shared');
          } else {
            await copyText(content || regenPrompt);
            setStatus('Copied (share unsupported)');
          }
          return;
        }

        if (action === 'up' || action === 'down') {
          const vote = action === 'up' ? 'up' : 'down';
          const payload = { vote, content: content || '', meta: { source: 'chat-actions-strip', ts: Date.now() } };
          if (feedbackWebhookUrl) {
            await postJson(feedbackWebhookUrl, payload);
            setStatus(vote === 'up' ? 'Thanks ✓' : 'Noted ✓');
          } else {
            setStatus(vote === 'up' ? 'Thumbs up ✓' : 'Thumbs down ✓');
          }
          return;
        }
      } catch (err) {
        setStatus('Error: ' + (err && err.message ? err.message : String(err)));
      }
    });
  })();
  </script>
  </div>
</div>
`;

      const markdown = `Chat Actions Strip rendered (density=${density}, feedback=${showFeedback}).`;

      return { success: true, html, markdown, error: '' };
    } catch (error) {
      return { success: false, error: error?.message || String(error), html: '', markdown: '' };
    }
  }
}

const ICON_REGEN = `<svg viewBox="0 0 24 24" fill="none"><path d="M20 12a8 8 0 1 1-2.34-5.66" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M20 4v6h-6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const ICON_COPY = `<svg viewBox="0 0 24 24" fill="none"><path d="M9 9h10v10H9z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M5 15H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;
const ICON_UPLOAD = `<svg viewBox="0 0 24 24" fill="none"><path d="M12 3v10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M8 7l4-4 4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 14v5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;
const ICON_THUMB_UP = `<svg viewBox="0 0 24 24" fill="none"><path d="M7 11v10H4V11h3Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M7 11l5-7a2 2 0 0 1 3 2l-1 5h6a2 2 0 0 1 2 2l-1 6a2 2 0 0 1-2 2H7" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
const ICON_THUMB_DOWN = `<svg viewBox="0 0 24 24" fill="none"><path d="M17 13V3h3v10h-3Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M17 13l-5 7a2 2 0 0 1-3-2l1-5H4a2 2 0 0 1-2-2l1-6a2 2 0 0 1 2-2h12" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/></svg>`;

export default new ChatActionsStrip();
