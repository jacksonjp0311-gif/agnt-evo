/**
 * wireAssistantToolbar.js
 *
 * Small adapter helpers to make a pinned action strip work across *any* chat surface.
 *
 * The only assumptions:
 * - you have a chronological `messages` array
 * - each message has `{ id, role, content }`
 * - you already have a "resend" function that can re-submit a user prompt
 */

export function findMessageIndex(messages, messageId) {
  if (!Array.isArray(messages)) return -1;
  return messages.findIndex((m) => m && m.id === messageId);
}

export function findPreviousUserMessage(messages, assistantMessageId) {
  const idx = findMessageIndex(messages, assistantMessageId);
  if (idx === -1) return null;
  for (let i = idx - 1; i >= 0; i--) {
    const m = messages[i];
    if (m && m.role === 'user' && typeof m.content === 'string' && m.content.trim()) return m;
  }
  return null;
}

/**
 * Generic regenerate handler.
 *
 * @param {object} opts
 * @param {Array} opts.messages - current message list
 * @param {string} opts.assistantMessageId - message id for the assistant message whose toolbar was clicked
 * @param {(userMessage: {id:string,content:string}) => Promise<void>} opts.resendUserMessage - function that re-submits the prompt
 */
export async function regenerateFromAssistant({ messages, assistantMessageId, resendUserMessage }) {
  const prevUser = findPreviousUserMessage(messages, assistantMessageId);
  if (!prevUser) return;
  await resendUserMessage({ id: prevUser.id, content: prevUser.content });
}

/**
 * Minimal feedback handler (wire to your own persistence / webhook / analytics).
 */
export function handleAssistantFeedback({ vote, assistantMessageId, onFeedback }) {
  if (!vote || !assistantMessageId) return;
  if (typeof onFeedback === 'function') onFeedback({ vote, assistantMessageId });
}
