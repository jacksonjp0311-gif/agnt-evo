const r=`# Discord API 💬\r
\r
## Id\r
\r
\`discord-api\`\r
\r
## Description\r
\r
Interacts with Discord servers to send messages, manage roles, upload files, and retrieve member information. Uses OAuth authentication to access user-specific Discord workspaces with comprehensive server management capabilities.\r
\r
## Tags\r
\r
discord, messaging, api, roles, files, server, oauth\r
\r
## Input Parameters\r
\r
### Required\r
\r
- **action** (string): Action to perform (\`SEND_MESSAGE\`, \`ASSIGN_ROLE\`, \`GET_MEMBERS\`, \`UPLOAD_FILE\`)\r
- **channelId** (string): Discord channel ID for message operations\r
\r
### Optional\r
\r
- **guildId** (string): Discord server/guild ID\r
- **message** (string): Message content for SEND_MESSAGE action\r
- **roleId** (string): Role ID for role management\r
- **memberIds** (string): Comma-separated list of member IDs for role assignment\r
- **fileName** (string): Name of file to upload\r
- **fileData** (string): Base64-encoded file data for upload\r
- **text** (string): Message text for file uploads\r
\r
## Output Format\r
\r
- **success** (boolean): Whether the Discord operation was successful\r
- **result** (object): Operation result including message IDs, member lists, or upload confirmations\r
- **error** (string|null): Error message if the operation failed\r
`;export{r as default};
