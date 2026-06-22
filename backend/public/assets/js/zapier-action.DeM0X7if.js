const r=`# Zapier Webhook\r
\r
## Overview\r
\r
The **Zapier Webhook** node sends data to 6,000+ apps via Zapier webhooks. Trigger actions like sending emails, creating tasks, posting to social media, and more by sending JSON data to your Zap's webhook URL.\r
\r
## Category\r
\r
**Action**\r
\r
## Parameters\r
\r
### zapWebhookUrl\r
\r
- **Type**: String\r
- **Required**: Yes\r
- **Description**: Your Zap's webhook URL. In Zapier: 1) Create a new Zap, 2) Choose 'Webhooks by Zapier' as the trigger, 3) Select 'Catch Hook', 4) Copy the webhook URL and paste it here.\r
\r
### payload\r
\r
- **Type**: String (code area)\r
- **Required**: Yes\r
- **Description**: JSON data to send to Zapier. Example: \`{"email": "user@example.com", "name": "John Doe", "amount": 100}\`. This data will be available in your Zap for mapping to other apps.\r
\r
## Outputs\r
\r
### success\r
\r
- **Type**: Boolean\r
- **Description**: Whether the webhook was triggered successfully\r
\r
### zapResponse\r
\r
- **Type**: Object\r
- **Description**: Response from Zapier webhook\r
\r
### triggeredZaps\r
\r
- **Type**: Array\r
- **Description**: List of triggered Zaps with status and timestamp\r
\r
### error\r
\r
- **Type**: String\r
- **Description**: Error message if the webhook failed\r
\r
## Use Cases\r
\r
1. **Send Notifications**: Trigger email, SMS, or push notifications\r
2. **Create Tasks**: Add tasks to Asana, Trello, or Todoist\r
3. **Update CRM**: Add or update contacts in Salesforce, HubSpot, etc.\r
4. **Post to Social Media**: Share content on Twitter, LinkedIn, Facebook\r
5. **Log Data**: Send data to Google Sheets, Airtable, or databases\r
6. **Trigger Automations**: Start complex multi-step Zaps\r
\r
## Setup Instructions\r
\r
### Step 1: Create Zap in Zapier\r
\r
1. Go to Zapier and create a new Zap\r
2. Choose "Webhooks by Zapier" as the trigger\r
3. Select "Catch Hook" as the trigger event\r
4. Copy the webhook URL provided by Zapier\r
\r
### Step 2: Configure Workflow Node\r
\r
1. Add Zapier Webhook node to your workflow\r
2. Paste the webhook URL into the \`zapWebhookUrl\` parameter\r
3. Define your JSON payload with the data you want to send\r
\r
### Step 3: Configure Zap Actions\r
\r
1. In Zapier, add action steps for what you want to happen\r
2. Map the webhook data fields to your action apps\r
3. Test your Zap\r
\r
### Step 4: Test\r
\r
1. Run your workflow\r
2. Verify the data appears in Zapier\r
3. Check that your Zap actions execute correctly\r
\r
## Example Configurations\r
\r
**Send Email via Gmail**\r
\r
\`\`\`\r
zapWebhookUrl: https://hooks.zapier.com/hooks/catch/123456/abcdef/\r
payload: {\r
  "to": "recipient@example.com",\r
  "subject": "Workflow Notification",\r
  "body": "Your workflow has completed successfully!"\r
}\r
\r
Zapier Action: Gmail - Send Email\r
Map fields: to, subject, body\r
\`\`\`\r
\r
**Create Trello Card**\r
\r
\`\`\`\r
zapWebhookUrl: https://hooks.zapier.com/hooks/catch/123456/abcdef/\r
payload: {\r
  "title": "New Task from Workflow",\r
  "description": "{{aiLLM.generatedText}}",\r
  "list": "To Do",\r
  "dueDate": "2024-12-31"\r
}\r
\r
Zapier Action: Trello - Create Card\r
Map fields: title, description, list, dueDate\r
\`\`\`\r
\r
**Add to Google Sheets**\r
\r
\`\`\`\r
zapWebhookUrl: https://hooks.zapier.com/hooks/catch/123456/abcdef/\r
payload: {\r
  "name": "{{formData.name}}",\r
  "email": "{{formData.email}}",\r
  "timestamp": "{{currentTime}}",\r
  "status": "Processed"\r
}\r
\r
Zapier Action: Google Sheets - Create Spreadsheet Row\r
Map fields: name, email, timestamp, status\r
\`\`\`\r
\r
**Post to Twitter**\r
\r
\`\`\`\r
zapWebhookUrl: https://hooks.zapier.com/hooks/catch/123456/abcdef/\r
payload: {\r
  "tweet": "{{aiLLM.generatedText}}",\r
  "hashtags": "#automation #workflow"\r
}\r
\r
Zapier Action: Twitter - Create Tweet\r
Map fields: tweet, hashtags\r
\`\`\`\r
\r
## Tips\r
\r
- Use descriptive field names in your payload for easier mapping in Zapier\r
- Test your webhook URL before deploying\r
- You can send any valid JSON structure\r
- Use workflow variables in your payload with \`{{nodeName.output}}\`\r
- Check Zapier's task history if webhooks aren't being received\r
- Zapier has a 30-second timeout for webhook responses\r
\r
## Common Patterns\r
\r
**Workflow Completion Notification**\r
\r
\`\`\`\r
1. Workflow processes data\r
2. Zapier Webhook sends completion status\r
3. Zapier sends email notification\r
4. Zapier logs to Google Sheets\r
\`\`\`\r
\r
**AI Content Distribution**\r
\r
\`\`\`\r
1. AI LLM generates content\r
2. Zapier Webhook sends content\r
3. Zapier posts to Twitter\r
4. Zapier posts to LinkedIn\r
5. Zapier saves to Notion\r
\`\`\`\r
\r
**Lead Processing**\r
\r
\`\`\`\r
1. Workflow qualifies lead\r
2. Zapier Webhook sends lead data\r
3. Zapier adds to CRM\r
4. Zapier sends welcome email\r
5. Zapier notifies sales team in Slack\r
\`\`\`\r
\r
**Data Sync**\r
\r
\`\`\`\r
1. Workflow transforms data\r
2. Zapier Webhook sends transformed data\r
3. Zapier updates multiple databases\r
4. Zapier sends confirmation\r
\`\`\`\r
\r
## Payload Examples\r
\r
**Simple Data**\r
\r
\`\`\`json\r
{\r
  "name": "John Doe",\r
  "email": "john@example.com",\r
  "status": "active"\r
}\r
\`\`\`\r
\r
**Nested Data**\r
\r
\`\`\`json\r
{\r
  "user": {\r
    "name": "John Doe",\r
    "email": "john@example.com"\r
  },\r
  "order": {\r
    "id": "12345",\r
    "total": 99.99,\r
    "items": ["Product A", "Product B"]\r
  }\r
}\r
\`\`\`\r
\r
**With Workflow Variables**\r
\r
\`\`\`json\r
{\r
  "generatedContent": "{{aiLLM.generatedText}}",\r
  "processedAt": "{{currentTimestamp}}",\r
  "workflowId": "{{workflowId}}",\r
  "success": true\r
}\r
\`\`\`\r
\r
## Troubleshooting\r
\r
**Webhook not triggering:**\r
\r
- Verify the webhook URL is correct and active\r
- Check that your Zap is turned on\r
- Review Zapier's task history for errors\r
- Ensure payload is valid JSON\r
\r
**Data not mapping:**\r
\r
- Check field names match exactly (case-sensitive)\r
- Verify JSON structure is correct\r
- Test with simple payload first\r
- Use Zapier's "Test Trigger" feature\r
\r
**Timeout errors:**\r
\r
- Reduce payload size if very large\r
- Check network connectivity\r
- Verify Zapier service status\r
\r
## Related Nodes\r
\r
- **Zapier Trigger**: Receive data from Zapier\r
- **Custom API Request**: For direct API integrations\r
- **Send Email**: For direct email sending\r
- **Data Transformer**: Transform data before sending\r
- **Conditional Logic**: Send different payloads based on conditions\r
\r
## Tags\r
\r
zapier, webhook, action, integration, automation, 6000+ apps, email, tasks, crm, social media\r
`;export{r as default};
