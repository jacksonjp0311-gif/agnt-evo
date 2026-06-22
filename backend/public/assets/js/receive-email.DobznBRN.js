const e=`# Email Receiver 📬\r
\r
## Id\r
\r
\`email-receiver\`\r
\r
## Description\r
\r
Monitors email inboxes for new messages and triggers workflows when emails are received. Supports processing email metadata including sender, subject, body content, and attachments. Uses polling to check for new emails at regular intervals.\r
\r
## Tags\r
\r
email, trigger, inbox, mail, polling, attachments\r
\r
## Input Parameters\r
\r
### Required\r
\r
- **workflowId** (string): Unique identifier for the workflow to trigger\r
- **emailAddress** (string): The email address to monitor for new messages\r
\r
### Optional\r
\r
- **pollInterval** (number, default=10000): Time in milliseconds between email checks\r
- **filter** (string): Optional filter criteria for incoming emails (subject contains, from address, etc.)\r
\r
## Output Format\r
\r
- **type** (string): Always "email" for email triggers\r
- **from** (string): Sender email address\r
- **to** (string): Recipient email address\r
- **subject** (string): Email subject line\r
- **body** (string): Plain text email content\r
- **html** (string): HTML email content (if available)\r
- **attachments** (array): Array of attachment objects with filename, type, and data\r
- **timestamp** (string): ISO timestamp when the email was received\r
`;export{e as default};
