const r=`# Zapier Trigger\r
\r
## Overview\r
\r
The **Zapier Trigger** node receives events from 6,000+ apps via Zapier. When something happens in your connected apps (new email, form submission, sale, etc.), this trigger fires your workflow, enabling powerful cross-platform automation.\r
\r
## Category\r
\r
**Trigger**\r
\r
## Parameters\r
\r
### webhookUrl\r
\r
- **Type**: String (readonly)\r
- **Value**: \`{{WEBHOOK_URL}}/webhook/{{WORKFLOWID}}\`\r
- **Description**: Copy this URL into your Zapier webhook action. In Zapier, add a 'Webhooks by Zapier' action and paste this URL.\r
\r
### authType\r
\r
- **Type**: String (select)\r
- **Required**: No\r
- **Default**: Bearer\r
- **Options**:\r
  - **None**: No authentication (not recommended)\r
  - **Basic**: Username/password authentication\r
  - **Bearer**: Token-based authentication (recommended)\r
- **Description**: Authentication method (recommended: Bearer for security)\r
\r
### authToken\r
\r
- **Type**: String\r
- **Required**: Conditional (when authType is Bearer)\r
- **Description**: Secret token to verify requests from Zapier. Generate a random string and add it to your Zap's headers as 'Authorization: Bearer YOUR_TOKEN'\r
\r
### username\r
\r
- **Type**: String\r
- **Required**: Conditional (when authType is Basic)\r
- **Description**: Username for Basic authentication\r
\r
### password\r
\r
- **Type**: String (password)\r
- **Required**: Conditional (when authType is Basic)\r
- **Description**: Password for Basic authentication\r
\r
## Outputs\r
\r
### method\r
\r
- **Type**: String\r
- **Description**: The HTTP method (always POST for Zapier)\r
\r
### headers\r
\r
- **Type**: Object\r
- **Description**: Request headers from Zapier\r
\r
### body\r
\r
- **Type**: Object\r
- **Description**: All data sent from Zapier - access fields like \`{{zapierTrigger.body.email}}\`, \`{{zapierTrigger.body.name}}\`, etc.\r
\r
### query\r
\r
- **Type**: Object\r
- **Description**: Query parameters (if any)\r
\r
### params\r
\r
- **Type**: Object\r
- **Description**: Route parameters (if any)\r
\r
## Use Cases\r
\r
1. **Form Submissions**: Trigger workflows when forms are submitted (Typeform, Google Forms, etc.)\r
2. **Email Notifications**: React to new emails from Gmail, Outlook, etc.\r
3. **E-commerce Events**: Process new orders from Shopify, WooCommerce, etc.\r
4. **CRM Updates**: Respond to new leads or contacts in Salesforce, HubSpot, etc.\r
5. **Social Media**: Monitor mentions, posts, or messages\r
6. **Calendar Events**: Trigger on new calendar events or reminders\r
\r
## Setup Instructions\r
\r
### Step 1: Copy Webhook URL\r
\r
1. Add Zapier Trigger node to your workflow\r
2. Copy the webhook URL from the node parameters\r
\r
### Step 2: Create Zap in Zapier\r
\r
1. Go to Zapier and create a new Zap\r
2. Choose your trigger app (e.g., "Gmail", "Typeform", "Shopify")\r
3. Configure the trigger event\r
\r
### Step 3: Add Webhook Action\r
\r
1. Add an action step\r
2. Choose "Webhooks by Zapier"\r
3. Select "POST" as the action\r
4. Paste your webhook URL\r
\r
### Step 4: Configure Authentication (Recommended)\r
\r
1. In your workflow, set authType to "Bearer"\r
2. Generate a secure random token\r
3. In Zapier, add a header:\r
   - Key: \`Authorization\`\r
   - Value: \`Bearer YOUR_TOKEN_HERE\`\r
\r
### Step 5: Map Data\r
\r
1. In Zapier, map the data you want to send\r
2. This data will be available in \`{{zapierTrigger.body}}\`\r
\r
### Step 6: Test\r
\r
1. Test your Zap in Zapier\r
2. Verify your workflow receives the data\r
\r
## Example Configurations\r
\r
**Gmail to Workflow**\r
\r
\`\`\`\r
Zapier Setup:\r
- Trigger: Gmail - New Email\r
- Action: Webhooks - POST\r
- URL: Your webhook URL\r
- Headers: Authorization: Bearer abc123xyz\r
\r
Workflow Access:\r
{{zapierTrigger.body.from}}\r
{{zapierTrigger.body.subject}}\r
{{zapierTrigger.body.body}}\r
\`\`\`\r
\r
**Typeform to Workflow**\r
\r
\`\`\`\r
Zapier Setup:\r
- Trigger: Typeform - New Entry\r
- Action: Webhooks - POST\r
- URL: Your webhook URL\r
\r
Workflow Access:\r
{{zapierTrigger.body.name}}\r
{{zapierTrigger.body.email}}\r
{{zapierTrigger.body.message}}\r
\`\`\`\r
\r
**Shopify Order to Workflow**\r
\r
\`\`\`\r
Zapier Setup:\r
- Trigger: Shopify - New Order\r
- Action: Webhooks - POST\r
- URL: Your webhook URL\r
\r
Workflow Access:\r
{{zapierTrigger.body.order_id}}\r
{{zapierTrigger.body.customer_email}}\r
{{zapierTrigger.body.total_price}}\r
\`\`\`\r
\r
## Security Best Practices\r
\r
1. **Always use Bearer authentication** for production workflows\r
2. **Generate strong random tokens** (at least 32 characters)\r
3. **Keep tokens secret** - don't share them publicly\r
4. **Rotate tokens periodically** for enhanced security\r
5. **Monitor webhook activity** for suspicious requests\r
\r
## Tips\r
\r
- Test your Zap before enabling it\r
- Use descriptive field names in Zapier for easier workflow access\r
- The body object structure depends on what you send from Zapier\r
- All data is available in \`{{zapierTrigger.body.fieldName}}\`\r
- Zapier always sends POST requests\r
- Check Zapier's task history if webhooks aren't firing\r
\r
## Common Patterns\r
\r
**Email Processing Workflow**\r
\r
\`\`\`\r
1. Zapier Trigger receives new email\r
2. AI LLM analyzes email content\r
3. Conditional logic routes based on analysis\r
4. Send appropriate response via Send Email\r
\`\`\`\r
\r
**Order Fulfillment Workflow**\r
\r
\`\`\`\r
1. Zapier Trigger receives new Shopify order\r
2. Database Operation stores order details\r
3. Send Email sends confirmation to customer\r
4. Slack API notifies fulfillment team\r
\`\`\`\r
\r
**Lead Qualification Workflow**\r
\r
\`\`\`\r
1. Zapier Trigger receives new form submission\r
2. AI LLM qualifies the lead\r
3. If qualified: Add to CRM via Custom API\r
4. Send Email with next steps\r
\`\`\`\r
\r
## Troubleshooting\r
\r
**Webhook not receiving data:**\r
\r
- Verify the webhook URL is correct\r
- Check that your Zap is turned on\r
- Review Zapier's task history for errors\r
- Ensure authentication tokens match\r
\r
**Authentication failing:**\r
\r
- Verify authType matches your setup\r
- Check that the token is correct\r
- Ensure header format is: \`Authorization: Bearer TOKEN\`\r
\r
**Data not accessible:**\r
\r
- Check the exact field names sent from Zapier\r
- Use \`{{zapierTrigger.body}}\` to see all available data\r
- Field names are case-sensitive\r
\r
## Related Nodes\r
\r
- **Zapier Webhook** (Action): Send data back to Zapier\r
- **Webhook Listener**: For non-Zapier webhook integrations\r
- **Custom API Request**: For direct API integrations\r
- **Conditional Logic**: Route based on received data\r
- **Data Transformer**: Transform incoming data\r
\r
## Tags\r
\r
zapier, trigger, webhook, integration, automation, 6000+ apps, forms, email, ecommerce\r
`;export{r as default};
