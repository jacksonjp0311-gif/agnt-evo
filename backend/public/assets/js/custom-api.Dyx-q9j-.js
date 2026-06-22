const r=`# Custom API 🔗\r
\r
## Id\r
\r
\`custom-api\`\r
\r
## Description\r
\r
Makes HTTP requests to any REST API endpoint with full support for authentication methods (Basic, Bearer, Webhook tokens), query parameters, headers, and request bodies. Supports JSON and plain text payloads with comprehensive error handling.\r
\r
## Tags\r
\r
api, http, rest, authentication, web, integration\r
\r
## Input Parameters\r
\r
### Required\r
\r
- **url** (string): The API endpoint URL\r
- **method** (string): HTTP method (\`GET\`, \`POST\`, \`PUT\`, \`DELETE\`, \`PATCH\`)\r
\r
### Optional\r
\r
- **query** (string): Query parameters as URL-encoded string\r
- **headers** (string|object): Request headers as JSON string or object\r
- **body** (string|object): Request body as JSON string or object\r
- **authType** (string): Authentication type (\`basic\`, \`bearer\`, \`webhook\`)\r
- **authToken** (string): Bearer or webhook token for authentication\r
- **username** (string): Username for Basic authentication\r
- **password** (string): Password for Basic authentication\r
\r
## Output Format\r
\r
- **success** (boolean): Whether the API request was successful\r
- **status** (number): HTTP status code\r
- **result** (any): Response data from the API\r
- **headers** (object): Response headers\r
- **error** (string|null): Error message if the request failed\r
`;export{r as default};
