# Open URL Toolkit (AGNT Plugin)

A small but high‑leverage AGNT plugin that lets agents and workflows **open real UIs in your external browser** on demand.

## What you get

### 1) `open-url-native` — open external browser (Windows/macOS/Linux)
Opens a URL in your **default system browser** (or best‑effort targeted browser).

- Windows: `cmd /c start "" <url>`
- macOS: `open <url>`
- Linux: `xdg-open <url>`

**Safety default:** requires `confirm=true`.

**Marketplace polish:** includes **rate limiting** to prevent accidental tab spam.

### 2) `open-url-native-plus` — external browser + query builder
Builds a URL from:
- `baseUrl` (http/https)
- `queryJson` (object → URL encoded)

Then opens it in your external browser.

This is perfect for:
- X composer prefill
- Google searches
- internal dashboards with query params

### 3) `open-url` — link + iframe embed helper
Returns a clickable link and (optionally) an iframe HTML snippet for inline preview.

### 4) `authorize-button` — pause → authorize → continue
Returns a self‑contained HTML widget containing an **Authorize & Continue** button that POSTs JSON to a webhook.

This is designed for governed workflows (e.g., ASF‑style “pause then explicit approval”).

---

## Agent “implicit open” behavior (recommended integration)

This plugin keeps a safe tool‑level gate (`confirm=true`).

For a great agent UX, treat an explicit user request to open something as **implicit authorization**:

### Suggested open-intent phrases (big list)
If the user message contains intent like:
- open
- launch
- bring up
- pull up
- take me to
- go to
- navigate to
- show me (in browser)
- view in browser
- open in chrome/edge/firefox
- open the UI
- open the console
- open the dashboard
- open the page
- open the site
- open the link
- pop open
- load this in browser

…then call `open-url-native` with `confirm=true`.

### Adaptive rule (beyond the list)
Even if a term is not listed, treat it as open intent when the user is clearly asking to **see an interactive interface** (a “helpful idea” to show a UI), e.g.:
- “let’s look at the console”
- “take me to the settings page”
- “show me the workflow in the browser”

---

## Tool reference

### `open-url-native`
Parameters:
- `url` (required): http(s) URL
- `confirm` (required): must be `true` to open
- `allowFile` (required): allow `file:///...`
- `browser` (optional): `default | chrome | edge | firefox` (best-effort)
- `profileDirectory` (optional): Chrome/Edge profile dir like `Default`, `Profile 1` (best-effort)
- `newWindow` (optional): best-effort
- `maxLaunches` / `windowSeconds` / `disableRateLimit`: rate limiting

### `open-url-native-plus`
Parameters:
- `baseUrl` (required)
- `queryJson` (optional)
- `confirm` (required)

### `authorize-button`
Parameters:
- `webhookUrl` (required)
- `payloadJson` (optional)
- `buttonText`, `description`

---

## Changelog
See `CHANGELOG.md`.

## License
MIT (see `LICENSE`).
