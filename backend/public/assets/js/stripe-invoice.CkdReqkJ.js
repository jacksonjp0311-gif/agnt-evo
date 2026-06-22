const n=`# Stripe Invoice 💳\r
\r
## Id\r
\r
\`stripe-invoice\`\r
\r
## Description\r
\r
Creates and sends professional invoices using Stripe's payment platform. Supports customer management, due dates, and automated invoice generation with comprehensive billing features.\r
\r
## Tags\r
\r
stripe, invoice, billing, payment, customer, due-date\r
\r
## Input Parameters\r
\r
### Required\r
\r
- **customerEmail** (string): Customer email address\r
- **amount** (number): Invoice amount in cents\r
- **currency** (string): Currency code (usd, eur, etc.)\r
- **description** (string): Invoice description\r
- **dueDate** (string): Due date in ISO format\r
\r
## Output Format\r
\r
- **success** (boolean): Whether the invoice was created successfully\r
- **invoiceId** (string): Stripe invoice ID\r
- **invoiceUrl** (string): Hosted invoice URL for customer access\r
- **amount** (number): Final invoice amount\r
- **error** (string|null): Error message if invoice creation failed\r
`;export{n as default};
