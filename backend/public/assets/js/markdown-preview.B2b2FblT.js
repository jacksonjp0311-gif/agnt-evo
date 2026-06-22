const r=`# Markdown Preview\r
\r
## Overview\r
\r
The **Markdown Preview** node renders markdown content with preview/source toggle functionality. It supports headers, bold, italic, links, code blocks, inline code, and lists, making it perfect for displaying formatted documentation and content in workflows.\r
\r
## Category\r
\r
**Widget**\r
\r
## Parameters\r
\r
### markdownSource\r
\r
- **Type**: String (textarea)\r
- **Required**: Yes\r
- **Description**: Markdown content to render\r
- **Features**: Supports drag & drop of .md files\r
- **Supported Syntax**:\r
  - Headers (# H1, ## H2, etc.)\r
  - Bold (\\*\\*text\\*\\*)\r
  - Italic (\\*text\\*)\r
  - Links ([text](url))\r
  - Code blocks (\\\`\\\`\\\`code\\\`\\\`\\\`)\r
  - Inline code (\\\`code\\\`)\r
  - Lists (ordered and unordered)\r
  - Tables\r
  - Blockquotes\r
\r
## Outputs\r
\r
### success\r
\r
- **Type**: Boolean\r
- **Description**: Whether the markdown was successfully processed\r
\r
### markdownContent\r
\r
- **Type**: String\r
- **Description**: The original markdown content\r
\r
### htmlContent\r
\r
- **Type**: String\r
- **Description**: The rendered HTML from markdown\r
\r
### metadata\r
\r
- **Type**: Object\r
- **Description**: Markdown metadata including:\r
  - Line count\r
  - Word count\r
  - Detected features (headers, links, images, code blocks, tables, lists)\r
\r
### error\r
\r
- **Type**: String\r
- **Description**: Error message if markdown processing failed\r
\r
## Use Cases\r
\r
1. **Documentation Display**: Render markdown documentation\r
2. **README Preview**: Display README files from repositories\r
3. **Blog Post Rendering**: Show markdown blog posts\r
4. **Note Taking**: Display formatted notes\r
5. **Report Generation**: Create formatted reports from markdown\r
6. **Content Management**: Preview markdown content before publishing\r
\r
## Example Configurations\r
\r
**Basic Markdown**\r
\r
\`\`\`\r
markdownSource: # Hello World\r
\r
This is a **bold** statement with *italic* text.\r
\r
- Item 1\r
- Item 2\r
- Item 3\r
\`\`\`\r
\r
**Markdown with Code**\r
\r
\`\`\`\r
markdownSource: ## Code Example\r
\r
Here's some JavaScript:\r
\r
\\\`\\\`\\\`javascript\r
function hello() {\r
  console.log("Hello World");\r
}\r
\\\`\\\`\\\`\r
\`\`\`\r
\r
**Markdown from Variable**\r
\r
\`\`\`\r
markdownSource: {{aiLLM.generatedText}}\r
\`\`\`\r
\r
## Tips\r
\r
- Toggle between preview and source view\r
- Supports all standard markdown syntax\r
- Metadata includes word count and feature detection\r
- Drag & drop support for .md files\r
- Great for displaying AI-generated content\r
- Can be combined with other preview nodes\r
\r
## Common Patterns\r
\r
**Documentation Generator**\r
\r
\`\`\`\r
1. Fetch markdown from repository\r
2. Display with Markdown Preview\r
3. Extract metadata for indexing\r
4. Publish or export\r
\`\`\`\r
\r
**AI Content Display**\r
\r
\`\`\`\r
1. Generate markdown content with AI LLM\r
2. Pass to Markdown Preview\r
3. Review formatted output\r
4. Save or publish content\r
\`\`\`\r
\r
**README Viewer**\r
\r
\`\`\`\r
1. Fetch README.md from GitHub API\r
2. Display with Markdown Preview\r
3. Show formatted documentation\r
\`\`\`\r
\r
## Markdown Syntax Reference\r
\r
**Headers**\r
\r
\`\`\`\r
# H1\r
## H2\r
### H3\r
\`\`\`\r
\r
**Emphasis**\r
\r
\`\`\`\r
*italic* or _italic_\r
**bold** or __bold__\r
***bold italic***\r
\`\`\`\r
\r
**Lists**\r
\r
\`\`\`\r
- Unordered item\r
- Another item\r
\r
1. Ordered item\r
2. Another item\r
\`\`\`\r
\r
**Links**\r
\r
\`\`\`\r
[Link text](https://example.com)\r
\`\`\`\r
\r
**Code**\r
\r
\`\`\`\r
Inline \`code\`\r
\r
\\\`\\\`\\\`javascript\r
// Code block\r
console.log("Hello");\r
\\\`\\\`\\\`\r
\`\`\`\r
\r
**Tables**\r
\r
\`\`\`\r
| Header 1 | Header 2 |\r
|----------|----------|\r
| Cell 1   | Cell 2   |\r
\`\`\`\r
\r
**Blockquotes**\r
\r
\`\`\`\r
> This is a quote\r
\`\`\`\r
\r
## Related Nodes\r
\r
- **Code Preview**: For displaying code with syntax highlighting\r
- **HTML Preview**: For displaying HTML content\r
- **AI LLM Call**: For generating markdown content\r
- **File System Operation**: For reading markdown files\r
- **GitHub API**: For fetching README files\r
\r
## Tags\r
\r
markdown, preview, render, display, widget, documentation, readme, formatting\r
`;export{r as default};
