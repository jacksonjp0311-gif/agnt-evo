const e=`# Slack Receiver 💬\r
\r
## Id\r
\r
\`slack-receiver\`\r
\r
## Description\r
\r
Monitors Slack channels for new messages and triggers workflows when messages are posted. Uses OAuth authentication to access user-specific Slack workspaces and supports real-time message polling with configurable intervals.\r
\r
## Tags\r
\r
slack, trigger, messaging, chat, oauth, polling\r
\r
## Input Parameters\r
\r
### Required\r
\r
- **channelId** (string): The Slack channel ID to monitor for new messages\r
- **userId** (string): User ID for OAuth authentication to access the Slack workspace\r
\r
### Optional\r
\r
- **pollInterval** (number, default=5000): Time in milliseconds between message checks\r
- **ignoreBots** (boolean, default=true): Whether to ignore messages from bots\r
\r
## Output Format\r
\r
- **content** (string): The text content of the Slack message\r
- **author** (string): Username of the message sender\r
- **authorId** (string): Unique ID of the message sender\r
- **channelId** (string): The channel where the message was posted\r
- **guildId** (string): The workspace/server ID (if applicable)\r
- **timestamp** (number): Unix timestamp when the message was sent\r
- **attachments** (array): Array of file attachments with metadata\r
`;export{e as default};
