const e=`# Discord Receiver 🎮\r
\r
## Id\r
\r
\`discord-receiver\`\r
\r
## Description\r
\r
Monitors Discord channels for new messages and triggers workflows when messages are received. Uses OAuth authentication to access user-specific Discord servers and supports real-time message processing with configurable channel filtering.\r
\r
## Tags\r
\r
discord, trigger, messaging, chat, oauth, real-time\r
\r
## Input Parameters\r
\r
### Required\r
\r
- **channelId** (string): The Discord channel ID to monitor for new messages\r
- **userId** (string): User ID for OAuth authentication to access the Discord server\r
\r
### Optional\r
\r
- **ignoreBots** (boolean, default=true): Whether to ignore messages from bots\r
- **serverId** (string): Specific Discord server/guild ID to limit monitoring scope\r
\r
## Output Format\r
\r
- **content** (string): The text content of the Discord message\r
- **author** (string): Username of the message sender\r
- **authorId** (string): Unique Discord ID of the message sender\r
- **channelId** (string): The channel where the message was posted\r
- **guildId** (string): The Discord server/guild ID\r
- **timestamp** (number): Unix timestamp when the message was sent\r
- **attachments** (array): Array of file attachments with metadata including filename, type, and URL\r
`;export{e as default};
