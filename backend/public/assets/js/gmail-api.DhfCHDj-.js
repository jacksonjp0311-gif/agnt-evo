const r=`# Gmail API 📧\r
\r
## Id\r
\r
\`gmail-api\`\r
\r
## Description\r
\r
Manages Gmail accounts with comprehensive email operations including sending, replying, searching, reading emails, and handling attachments. Uses OAuth authentication for secure Gmail integration.\r
\r
## Tags\r
\r
gmail, email, api, google, oauth, attachments, search\r
\r
## Input Parameters\r
\r
### Required\r
\r
- **operation** (string): Action to perform (\`Send Email\`, \`Reply to Email\`, \`Search and Read Emails\`, \`Read Email\`, \`Modify Email\`, \`Get Attachments\`)\r
\r
### Optional\r
\r
- **to** (string): Recipient email for sending\r
- **subject** (string): Email subject\r
- **body** (string): Email body content\r
- **messageId** (string): Email ID for operations\r
- **searchQuery** (string): Gmail search query\r
- **maxResults** (number): Maximum results for search\r
- **addLabelIds** (array): Labels to add\r
- **removeLabelIds** (array): Labels to remove\r
\r
## Output Format\r
\r
- **success** (boolean): Whether the Gmail operation was successful\r
- **result** (object): Operation result including email data, attachments, or search results\r
- **error** (string|null): Error message if the operation failed\r
`;export{r as default};
