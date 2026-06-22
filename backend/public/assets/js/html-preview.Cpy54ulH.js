const r=`# HTML Preview\r
\r
## Overview\r
\r
The **HTML Preview** node renders HTML content in a sandboxed preview window with configurable security levels. It supports raw HTML strings, URLs, base64-encoded HTML, and drag & drop .html files. The node automatically extracts metadata about scripts, styles, and external resources.\r
\r
## Category\r
\r
**Widget**\r
\r
## Parameters\r
\r
### htmlSource\r
\r
- **Type**: String (textarea)\r
- **Required**: Yes\r
- **Description**: HTML content to preview\r
- **Supported Formats**:\r
  - Raw HTML string\r
  - URL to fetch HTML from\r
  - Base64-encoded HTML (data:text/html;base64,...)\r
  - Blob URL\r
  - Drag & drop .html files\r
\r
### sandboxMode\r
\r
- **Type**: String (select)\r
- **Required**: No\r
- **Default**: Strict\r
- **Options**:\r
  - **Strict**: Blocks all scripts and inline event handlers (safest)\r
  - **Allow Scripts**: Allows scripts but blocks inline event handlers\r
  - **Full Access**: No restrictions (use with caution)\r
- **Description**: Security sandbox level for the HTML preview\r
\r
## Outputs\r
\r
### success\r
\r
- **Type**: Boolean\r
- **Description**: Whether the HTML was successfully processed\r
\r
### htmlContent\r
\r
- **Type**: String\r
- **Description**: The processed HTML content ready for rendering\r
\r
### metadata\r
\r
- **Type**: Object\r
- **Description**: Extracted HTML metadata including:\r
  - Character count\r
  - Script detection (inline and external)\r
  - Style detection (inline and external)\r
  - External resources count\r
  - Source type (raw, url, base64, blob)\r
\r
### error\r
\r
- **Type**: String\r
- **Description**: Error message if HTML processing failed\r
\r
## Use Cases\r
\r
1. **Email Template Preview**: Preview HTML email templates before sending\r
2. **Web Page Testing**: Test HTML snippets or full pages\r
3. **Documentation Display**: Render HTML documentation\r
4. **Report Generation**: Display HTML reports from data\r
5. **Widget Development**: Preview custom HTML widgets\r
6. **Content Validation**: Verify HTML structure and rendering\r
\r
## Example Configurations\r
\r
**Preview Raw HTML**\r
\r
\`\`\`\r
htmlSource: <div><h1>Hello World</h1><p>This is a test.</p></div>\r
sandboxMode: Strict\r
\`\`\`\r
\r
**Preview HTML from URL**\r
\r
\`\`\`\r
htmlSource: https://example.com/page.html\r
sandboxMode: Allow Scripts\r
\`\`\`\r
\r
**Preview Base64 HTML**\r
\r
\`\`\`\r
htmlSource: data:text/html;base64,PGh0bWw+PGJvZHk+SGVsbG88L2JvZHk+PC9odG1sPg==\r
sandboxMode: Strict\r
\`\`\`\r
\r
## Security Considerations\r
\r
### Strict Mode (Recommended)\r
\r
- Blocks all JavaScript execution\r
- Blocks inline event handlers (onclick, onload, etc.)\r
- Prevents form submissions\r
- Safest option for untrusted content\r
\r
### Allow Scripts Mode\r
\r
- Allows JavaScript execution\r
- Still blocks inline event handlers\r
- Use for trusted content that needs interactivity\r
\r
### Full Access Mode\r
\r
- No security restrictions\r
- **Only use with fully trusted content**\r
- Potential security risk with untrusted HTML\r
\r
## Tips\r
\r
- Always use **Strict** mode for untrusted or user-generated HTML\r
- The node extracts metadata about scripts and styles automatically\r
- Supports drag & drop for easy HTML file upload\r
- Can fetch HTML from remote URLs\r
- Handles base64-encoded HTML seamlessly\r
- Metadata includes character count and resource detection\r
\r
## Common Patterns\r
\r
**Email Template Workflow**\r
\r
\`\`\`\r
1. Generate HTML email template with AI LLM\r
2. Pass to HTML Preview with Strict mode\r
3. Review rendering before sending\r
4. Send via Send Email node\r
\`\`\`\r
\r
**Web Scraping Preview**\r
\r
\`\`\`\r
1. Scrape HTML with Web Scrape node\r
2. Pass to HTML Preview for visual inspection\r
3. Extract specific elements or data\r
\`\`\`\r
\r
**Dynamic Report Generation**\r
\r
\`\`\`\r
1. Fetch data from API\r
2. Generate HTML report with Execute JavaScript\r
3. Preview with HTML Preview\r
4. Export or email the report\r
\`\`\`\r
\r
## Related Nodes\r
\r
- **Web Scrape**: For fetching HTML from websites\r
- **Execute JavaScript**: For generating dynamic HTML\r
- **Send Email**: For sending HTML emails\r
- **Media Preview**: For displaying images and videos\r
- **Code Preview**: For viewing HTML source code\r
\r
## Tags\r
\r
html, preview, render, display, widget, sandbox, security, web, email, template\r
`;export{r as default};
