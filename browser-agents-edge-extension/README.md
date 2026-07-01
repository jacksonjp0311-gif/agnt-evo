# AGNT Browser Agents (Edge Extension)

This is a Manifest V3 Edge extension that gives you a **side panel agent chat** on every page.

## Features

- Floating **AGNT** button injected into all pages
- Opens a **Side Panel** chat UI
- Captures page URL/title and current text selection
- Talks to your local AGNT server (`http://localhost:3333` by default)

## Setup (Edge)

1. Open: `edge://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select this folder:

`C:\\Users\\jacks\\OneDrive\\Desktop\\agnt-evo\\browser-agents-edge-extension`

5. Open the extension **Options** page and set:
   - AGNT Base URL
   - AGNT token (from AGNT web app: `localStorage.getItem('token')`)

## Notes

- This first version uses a long-lived token pasted into Options. If you want, we can evolve it to a safer short-lived token broker flow.
- Next upgrade: SSE streaming via `/api/agents/:id/chat-stream`.
