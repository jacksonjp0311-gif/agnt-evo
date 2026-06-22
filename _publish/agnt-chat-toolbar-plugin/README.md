# AGNT Chat Toolbar Plugin

> **Version:** 1.0.0
> **License:** MIT
> **Author:** James Paul Jackson

A sleek, theme-aware action toolbar pinned to every assistant message in AGNT. Designed to match the [AGNT Design System](https://github.com/agnt-gg/agnt/blob/main/DESIGN.md) — dark-first, neon-accented, compact, and futuristic.

---

## Table of Contents

- [Features](#features)
- [Screenshots](#screenshots)
- [Installation](#installation)
- [Actions](#actions)
- [Adapter Guide](#adapter-guide)
- [Theming](#theming)
- [Optional `.agnt` Tool](#optional-agnt-tool)
- [Development](#development)
- [License](#license)

---

## Features

| Feature | Description |
|---------|-------------|
| **Pinned Toolbar** | Always visible under every assistant message |
| **Semi-Translucent Glass** | Blurred backdrop with subtle gradient edge |
| **Darkens on Hover** | Visual feedback on strip hover |
| **Neon Accent Hover** | Per-button glow using AGNT design tokens |
| **Theme-Aware** | Inherits colors from AGNT CSS variables — works across all themes |
| **Responsive** | Wraps cleanly regardless of message width |
| **Regenerate** | Re-runs from the previous user message |
| **Copy** | Copies the assistant response to clipboard |
| **Share / Upload** | Web Share API fallback to clipboard |
| **Copy Conversation (α)** | Copies the entire conversation in Markdown format |
| **Generate Artifact (▶▶)** | Downloads the conversation as a structured JSON artifact |
| **Thumbs Up / Down** | Feedback events (wire to your own persistence) |

---

## Screenshots

*Toolbar under an assistant message:*

```
┌─────────────────────────────────────────────────────┐
│  Here is the assistant response...                  │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ ↻  ⧉  ↑  α  ▶▶  │  👍  👎                  │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

**Icon Legend:**

| Icon | Label | Action |
|------|-------|--------|
| ↻ | Regenerate | Re-runs from the previous user message |
| ⧉ | Copy | Copies the assistant response |
| ↑ | Share / Upload | Web Share or clipboard fallback |
| α | Copy Conversation | Copies entire conversation as Markdown |
| ▶▶ | Generate Artifact | Downloads conversation as JSON artifact |
| 👍 | Thumbs Up | Emits feedback event |
| 👎 | Thumbs Down | Emits feedback event |

---

## Installation

### Method 1: Apply the Patch (Recommended)

From your AGNT repo root:

```bash
git apply patches/agnt-chat-toolbar.patch
```

Then build the frontend:

```bash
cd frontend
npm install
npm run build
```

Restart AGNT (quit + relaunch the Electron app).

### Method 2: Manual Integration

If you prefer to integrate manually or adapt for a fork:

1. Add the toolbar markup to your `MessageItem.vue` equivalent
2. Add the CSS from the patch's `<style scoped>` section
3. Wire the `@assistant-action` event in your chat container
4. See [Adapter Guide](#adapter-guide) for the event contract

---

## Actions

### Regenerate

Finds the previous user message in the conversation and re-submits it using the existing edit+resend flow.

**Payload:**
```json
{ "action": "regenerate", "messageId": "<assistant-message-id>" }
```

### Copy

Copies the current assistant message content to clipboard.

### Share / Upload

Uses the Web Share API if available; falls back to clipboard copy.

### Copy Conversation (α)

Copies the entire conversation (all roles) to clipboard in Markdown format:

```markdown
### USER
Hello, how are you?

---

### ASSISTANT
I'm doing well, thank you!

---
```

### Generate Artifact (▶▶)

Downloads the conversation as a structured JSON artifact:

```json
{
  "kind": "conversation",
  "title": "Conversation Artifact",
  "content": "### USER\n...",
  "timestamp": 1718640000000,
  "source": "chat-toolbar"
}
```

### Thumbs Up / Down

Emits a feedback event. Wire to your own persistence, webhook, or analytics.

**Payload:**
```json
{ "action": "feedback", "vote": "up" }
```

---

## Adapter Guide

The toolbar emits a single event: `@assistant-action`. Wire it in any chat surface.

### Event Contract

```typescript
interface AssistantActionEvent {
  action: "regenerate" | "copy-conversation" | "generate-artifact" | "feedback";
  messageId: string;
  vote?: "up" | "down";
}
```

### Generic Wiring (Framework-Agnostic)

```javascript
import { regenerateFromAssistant } from "./adapter/wireAssistantToolbar";

async function onAssistantAction(payload) {
  const { action, messageId, vote } = payload;

  switch (action) {
    case "regenerate":
      await regenerateFromAssistant({
        messages,                          // your message list
        assistantMessageId: messageId,
        resendUserMessage: async ({ content }) => resend(content), // your resend fn
      });
      break;

    case "copy-conversation":
      // Copy all messages to clipboard
      break;

    case "generate-artifact":
      // Download conversation as JSON
      break;

    case "feedback":
      // Persist vote to your backend
      break;
  }
}
```

### AGNT-Specific Notes

AGNT has multiple chat surfaces:

- **Main Orchestrator Chat** — `Chat.vue` (legacy `chat` Vuex module)
- **Unified Chats** — `UnifiedChatContainer.vue` (agent/workflow/tool/widget/artifact panels)

Both are wired in this patch. If you're building a custom chat surface, follow the same pattern: listen for `@assistant-action` and handle each action.

---

## Theming

The toolbar uses **AGNT design tokens** — it automatically adapts to any theme.

### Accent Colors

| Button | Token | Fallback |
|--------|-------|----------|
| Regenerate | `--color-secondary` | `#12e0ff` (cyan) |
| Copy | `--color-primary` | `#e53d8f` (pink) |
| Share | `--color-success` | `#19ef83` (green) |
| Copy Conversation (α) | `--color-indigo` | `#7d3de5` |
| Generate Artifact (▶▶) | `--color-warning` | `#ff9500` (orange) |
| Thumbs Up | `--color-warning` | `#ffd700` (yellow) |
| Thumbs Down | `--color-violet` | `#d13de5` |

### Hover States

- Background: `var(--color-lighter-0, rgba(255,255,255,0.1))`
- Border: `var(--color-lighter-1, rgba(255,255,255,0.2))`

### Strip Container

- Background: Linear gradient from `rgba(bg-rgb, 0.34)` to `rgba(bg-rgb, 0.22)`
- Border: `rgba(255,255,255,0.10)`
- Blur: `backdrop-filter: blur(12px)`
- Shadow: `0 10px 30px rgba(0,0,0,0.25)`

---

## Optional `.agnt` Tool

The repo includes a standalone AGNT tool (`chat-actions-strip`) that renders the toolbar as a widget. This is useful for:

- Manual embedding in agent responses
- Webhook posting (share/feedback)

### Build

```bash
# Copy to your AGNT repo
cp -r agnt-plugin/chat-actions-strip your-agnt-repo/backend/plugins/dev/

# Build
cd your-agnt-repo/backend/plugins
node build-plugin.js chat-actions-strip
```

### Install

Use the AGNT Plugins UI or:

```bash
curl -X POST http://localhost:3333/api/plugins/install-file \
  -H "Authorization: Bearer $AGNT_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"chat-actions-strip","fileName":"chat-actions-strip.agnt","fileData":"<base64>"}'
```

---

## Development

### Project Structure

```
agnt-chat-toolbar-plugin/
├── README.md                          # This file
├── LICENSE                            # MIT
├── package.json
├── .gitignore
├── patches/
│   └── agnt-chat-toolbar.patch        # UI integration patch
├── adapter/
│   ├── wireAssistantToolbar.js        # Generic wiring helpers
│   └── README.md                      # Adapter documentation
└── agnt-plugin/
    └── chat-actions-strip/            # Optional .agnt tool source
        ├── manifest.json
        ├── chat-actions-strip.js
        └── package.json
```

### Local Testing

1. Apply the patch to your AGNT repo
2. Build the frontend: `cd frontend && npm run build`
3. Launch AGNT: `npm start`
4. Open any chat — the toolbar appears under assistant messages

---

## License

MIT License. See [LICENSE](./LICENSE) for full text.

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -m "Add my feature"`
4. Push: `git push origin feature/my-feature`
5. Open a Pull Request

---

## Changelog

### v1.1.0 (2026-06-17)

- **Native Share**: Share button now uses `navigator.share()` with title + text + URL for rich native share sheets on mobile/desktop
- **Glow + Shake Animation**: Entire bar glows with cyan→pink neon pulse and subtle horizontal shake on any button click
- **Haptic Feedback**: Short vibration pattern on mobile devices via `navigator.vibrate()`
- **Scoped Feedback**: Each bar's glow is scoped to its component ref (fixes bug where only the first bar animated)
- Updated patch file
- Updated ChatToolbar.vue adapter component

### v1.0.0 (2026-06-17)

- Initial release
- Pinned toolbar with Regenerate, Copy, Share, Copy Conversation (α), Generate Artifact (▶▶), Thumbs Up/Down
- AGNT Design System token-based theming
- Adapter for any chat surface
- Optional `.agnt` tool for webhook support
