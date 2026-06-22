const n=`# Text Label\r
\r
## Overview\r
\r
The **Text Label** node displays a text label in the workflow canvas, providing additional context, documentation, or information. It's a visual utility that helps organize and document your workflows without affecting execution.\r
\r
## Category\r
\r
**Utility**\r
\r
## Parameters\r
\r
This node has no configurable parameters. The label text is set directly on the node in the workflow canvas.\r
\r
## Outputs\r
\r
This node produces no outputs. It is purely for visual documentation and organization.\r
\r
## Use Cases\r
\r
1. **Workflow Documentation**: Add notes and explanations to complex workflows\r
2. **Section Headers**: Label different sections of your workflow\r
3. **Instructions**: Provide guidance for other users or future reference\r
4. **Reminders**: Add important notes about workflow behavior\r
5. **Version Notes**: Document changes or version information\r
6. **Warnings**: Highlight critical sections or potential issues\r
\r
## How to Use\r
\r
1. Drag the Text Label node onto your workflow canvas\r
2. Double-click the node or edit its text property\r
3. Enter your label text\r
4. Position the label near the relevant workflow section\r
5. Resize or style as needed\r
\r
## Example Uses\r
\r
**Section Headers**\r
\r
\`\`\`\r
=== DATA PROCESSING ===\r
(Place above data processing nodes)\r
\r
=== API CALLS ===\r
(Place above API-related nodes)\r
\r
=== NOTIFICATIONS ===\r
(Place above email/notification nodes)\r
\`\`\`\r
\r
**Documentation Notes**\r
\r
\`\`\`\r
NOTE: This workflow runs every 5 minutes\r
Check the timer trigger settings if frequency needs adjustment\r
\r
IMPORTANT: API key must be configured in settings\r
Go to Settings > Integrations > Custom API\r
\`\`\`\r
\r
**Workflow Instructions**\r
\r
\`\`\`\r
WORKFLOW PURPOSE:\r
Processes incoming form submissions and sends\r
confirmation emails to users\r
\r
MAINTENANCE:\r
Update email template in Send Email node\r
when marketing copy changes\r
\`\`\`\r
\r
**Version Information**\r
\r
\`\`\`\r
Version 2.1.0\r
Last Updated: 2024-01-15\r
Changes: Added error handling and retry logic\r
\`\`\`\r
\r
## Tips\r
\r
- Use consistent formatting for better readability\r
- Place labels near the nodes they describe\r
- Use ALL CAPS or === markers for section headers\r
- Keep labels concise but informative\r
- Use labels to explain complex logic or conditions\r
- Document any non-obvious workflow behavior\r
- Add contact information for workflow maintainers\r
\r
## Best Practices\r
\r
### Organize Workflows\r
\r
\`\`\`\r
Use labels to divide workflows into logical sections:\r
- Input/Trigger Section\r
- Data Processing Section\r
- Business Logic Section\r
- Output/Action Section\r
\`\`\`\r
\r
### Document Decisions\r
\r
\`\`\`\r
Explain why certain approaches were chosen:\r
"Using parallel execution here to improve performance"\r
"Delay added to respect API rate limits"\r
\`\`\`\r
\r
### Warn About Changes\r
\r
\`\`\`\r
Alert others about sensitive areas:\r
"⚠️ DO NOT MODIFY - Connected to production database"\r
"⚠️ CRITICAL - This affects billing calculations"\r
\`\`\`\r
\r
### Provide Context\r
\r
\`\`\`\r
Help others understand the workflow:\r
"This workflow processes customer refunds"\r
"Triggered when payment fails 3 times"\r
"Sends notification to finance team"\r
\`\`\`\r
\r
## Common Label Patterns\r
\r
**Section Dividers**\r
\r
\`\`\`\r
━━━━━━━━━━━━━━━━━━━━━━\r
   INITIALIZATION\r
━━━━━━━━━━━━━━━━━━━━━━\r
\`\`\`\r
\r
**Status Indicators**\r
\r
\`\`\`\r
✓ TESTED AND WORKING\r
⚠️ NEEDS REVIEW\r
🚧 UNDER DEVELOPMENT\r
❌ DEPRECATED - DO NOT USE\r
\`\`\`\r
\r
**Workflow Metadata**\r
\r
\`\`\`\r
Owner: Engineering Team\r
Contact: eng@company.com\r
Last Review: 2024-01-15\r
Next Review: 2024-04-15\r
\`\`\`\r
\r
**Conditional Logic Explanation**\r
\r
\`\`\`\r
IF customer is VIP:\r
  → Send to priority queue\r
ELSE:\r
  → Send to standard queue\r
\`\`\`\r
\r
## Styling Suggestions\r
\r
**Use Symbols**\r
\r
\`\`\`\r
→ Flow direction\r
✓ Completed/Verified\r
⚠️ Warning/Caution\r
❌ Error/Deprecated\r
🔄 Loop/Repeat\r
⏱️ Time-based\r
📧 Email-related\r
💾 Database operation\r
\`\`\`\r
\r
**Use Formatting**\r
\r
\`\`\`\r
UPPERCASE for headers\r
lowercase for notes\r
--- for dividers\r
=== for major sections\r
\`\`\`\r
\r
## Related Nodes\r
\r
While the Text Label node doesn't interact with other nodes, it complements:\r
\r
- All workflow nodes (for documentation)\r
- Complex conditional logic (for explanation)\r
- Parallel execution blocks (for organization)\r
- Loop structures (for clarity)\r
\r
## Tags\r
\r
label, text, documentation, notes, organization, workflow, visual, utility, annotation\r
`;export{n as default};
