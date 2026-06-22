const e=`# Send Email 📧\r
\r
## Id\r
\r
\`sendEmail\`\r
\r
## Description\r
\r
Sends emails using SMTP configuration. Supports both plain text and HTML email formats with customizable sender names and workflow-specific email addresses.\r
\r
## Tags\r
\r
email, communication, smtp, notification, messaging\r
\r
## Input Parameters\r
\r
### Required\r
\r
- **to** (string): Recipient email address (can include name format like "Name <email@domain.com>")\r
- **subject** (string): Email subject line\r
- **body** (string): Email content (text or HTML depending on isHtml flag)\r
\r
### Optional\r
\r
- **isHtml** (boolean, default=false): Whether the body content should be treated as HTML\r
- **senderName** (string, default='AGNT Workflow'): Custom sender name that appears in the "From" field\r
\r
## Output Format\r
\r
- **success** (boolean): Indicates whether the email was sent successfully\r
- **content** (object): Contains the original parameters sent (to, subject, body, etc.)\r
- **messageId** (string): Unique message identifier from the email service\r
- **error** (string|null): Error message if the email sending failed\r
`;export{e as default};
