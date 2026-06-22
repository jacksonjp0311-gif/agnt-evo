const r=`# MCP Client 🔌\r
\r
## Id\r
\r
\`mcp-client\`\r
\r
## Description\r
\r
Connects to Model Context Protocol (MCP) servers to access tools, resources, and prompts. Supports real-time communication via SSE/WebSocket and provides comprehensive MCP server interaction capabilities.\r
\r
## Tags\r
\r
mcp, client, tools, resources, prompts, api, sse, websocket\r
\r
## Input Parameters\r
\r
### Required\r
\r
- **serverUrl** (string): MCP server URL endpoint\r
- **action** (string): Action to perform (\`List Tools\`, \`Call Tool\`, \`List Resources\`, \`Get Resource\`, \`List Prompts\`, \`Get Prompt\`)\r
\r
### Optional\r
\r
- **toolName** (string): Tool name for Call Tool action\r
- **toolArgs** (string): JSON arguments for tool calls\r
- **resourceUri** (string): Resource URI for Get Resource action\r
- **promptName** (string): Prompt name for Get Prompt action\r
- **promptArgs** (string): Arguments for prompt execution\r
\r
## Output Format\r
\r
- **success** (boolean): Whether the MCP operation was successful\r
- **tools** (array): Available tools from MCP server\r
- **resources** (array): Available resources from MCP server\r
- **prompts** (array): Available prompts from MCP server\r
- **result** (object): Operation result including tool responses or resource data\r
- **error** (string|null): Error message if the operation failed\r
`;export{r as default};
