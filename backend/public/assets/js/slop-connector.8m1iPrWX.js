const r=`# SLOP Connector 🔗\r
\r
## Id\r
\r
\`slop-connector\`\r
\r
## Description\r
\r
Connects to SLOP AI services with comprehensive API integration. Supports REST, SSE, and WebSocket connections for chat, memory, tools, and resources. Features flexible authentication and streaming capabilities.\r
\r
## Tags\r
\r
slop, ai, api, connector, chat, memory, tools, resources\r
\r
## Input Parameters\r
\r
### Required\r
\r
- **baseUrl** (string): Base URL for SLOP service\r
- **endpoint** (string): API endpoint (info, chat, memory, tools, resources, pay)\r
- **method** (string): HTTP method (GET, POST, PUT, DELETE)\r
\r
### Optional\r
\r
- **resourceId** (string): Resource ID for specific operations\r
- **toolId** (string): Tool ID for tool operations\r
- **queryParams** (string): Query parameters as JSON\r
- **payload** (string): Request payload as JSON\r
- **authToken** (string): Authentication token\r
- **streamMode** (string): Streaming mode (none, sse, websocket)\r
\r
## Output Format\r
\r
- **success** (boolean): Whether the SLOP operation was successful\r
- **result** (object): Operation result including API responses or streaming data\r
- **status** (number): HTTP status code\r
- **error** (string|null): Error message if the operation failed\r
`;export{r as default};
