# Adapter: use the toolbar in any chat surface

The pinned toolbar UI is rendered in the message component (AGNT’s `MessageItem.vue`).
To make the actions *do something* in different chat containers, you wire the emitted event:

- `@assistant-action="..."`

## Event contract

`MessageItem.vue` emits:

```js
{
  action: "regenerate" | "feedback",
  messageId: "<assistant-message-id>",
  vote?: "up" | "down"
}
```

## Generic wiring (framework-agnostic)

1) Get the messages array.
2) On `regenerate`, find the previous user message.
3) Call your existing “resend / edit+resend / replay” function with that user content.

This repo includes a helper:

- `adapter/wireAssistantToolbar.js`

Example:

```js
import { regenerateFromAssistant } from "./adapter/wireAssistantToolbar";

async function onAssistantAction(payload) {
  if (payload.action === "regenerate") {
    await regenerateFromAssistant({
      messages, // your current list
      assistantMessageId: payload.messageId,
      resendUserMessage: async ({ content }) => resend(content) // your app’s resend function
    });
  }
}
```

## AGNT-specific notes

AGNT has multiple chat surfaces:

- Orchestrator main chat (legacy `chat` Vuex module)
- Unified chats (agent/workflow/tool/widget/artifact panels) (`chatUnified` Vuex module)

In AGNT we wire both:

- `frontend/src/views/Terminal/CenterPanel/screens/Chat/Chat.vue`
- `frontend/src/views/_components/chat/UnifiedChatContainer.vue`

See `patches/` for a ready-to-apply diff.
