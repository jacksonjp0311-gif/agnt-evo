const e=`# Webhook Receiver 🌐\r
\r
## Id\r
\r
\`webhook-receiver\`\r
\r
## Description\r
\r
Listens for incoming HTTP webhooks to trigger workflows. Supports multiple authentication methods including Basic Auth, Bearer tokens, and custom webhook tokens. Polls a remote server for webhook events and processes them based on configured authentication and method requirements.\r
\r
## Tags\r
\r
webhook, trigger, http, api, authentication, polling\r
\r
## Input Parameters\r
\r
### Required\r
\r
- **workflowId** (string): Unique identifier for the workflow to trigger\r
- **method** (string): HTTP method to accept (GET, POST, PUT, DELETE, etc.)\r
- **authType** (string): Authentication type (none, basic, bearer, webhook)\r
\r
### Optional\r
\r
- **authToken** (string) [bearer/webhook auth only]: Bearer token or webhook token for authentication\r
- **username** (string) [basic auth only]: Username for Basic authentication\r
- **password** (string) [basic auth only]: Password for Basic authentication\r
\r
## Output Format\r
\r
- **webhookUrl** (string): The unique webhook URL endpoint for receiving triggers\r
- **status** (string): Registration status (success/error)\r
- **message** (string): Detailed status message\r
`;export{e as default};
