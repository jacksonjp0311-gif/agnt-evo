const n=`# Send Slack Message 💬\r
\r
## Id\r
\r
\`send-slack-message\`\r
\r
## Description\r
\r
Sends messages to Slack channels using OAuth authentication. Supports real-time messaging with comprehensive channel management and user-specific workspace integration.\r
\r
## Tags\r
\r
slack, messaging, api, oauth, channels, communication\r
\r
## Input Parameters\r
\r
### Required\r
\r
- **channelId** (string): Slack channel ID to send message to\r
- **message** (string): Message content to send\r
\r
## Output Format\r
\r
- **success** (boolean): Whether the message was sent successfully\r
- **timestamp** (string): Message timestamp\r
- **error** (string|null): Error message if sending failed\r
`;export{n as default};
