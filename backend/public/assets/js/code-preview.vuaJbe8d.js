const n=`# Code Preview\r
\r
## Overview\r
\r
The **Code Preview** node displays syntax-highlighted code with automatic language detection. It supports drag & drop of code files and auto-detects programming languages from file extensions, making it perfect for displaying code snippets in workflows.\r
\r
## Category\r
\r
**Widget**\r
\r
## Parameters\r
\r
### codeSource\r
\r
- **Type**: Code (textarea)\r
- **Required**: Yes\r
- **Description**: Code content to display\r
- **Features**: Supports drag & drop of code files (.js, .py, .java, .html, .css, etc.)\r
\r
### language\r
\r
- **Type**: String (select)\r
- **Required**: No\r
- **Default**: javascript\r
- **Options**:\r
  - javascript\r
  - typescript\r
  - python\r
  - java\r
  - csharp\r
  - cpp\r
  - html\r
  - css\r
  - json\r
  - markdown\r
  - sql\r
  - bash\r
  - plaintext\r
- **Description**: Programming language for syntax highlighting\r
\r
## Outputs\r
\r
### success\r
\r
- **Type**: Boolean\r
- **Description**: Whether the code was successfully processed\r
\r
### codeContent\r
\r
- **Type**: String\r
- **Description**: The code content\r
\r
### language\r
\r
- **Type**: String\r
- **Description**: The detected or specified programming language\r
\r
### metadata\r
\r
- **Type**: Object\r
- **Description**: Code metadata including:\r
  - Line count\r
  - Complexity metrics\r
  - Detected features (functions, classes, comments)\r
  - Character count\r
\r
### error\r
\r
- **Type**: String\r
- **Description**: Error message if code processing failed\r
\r
## Use Cases\r
\r
1. **Code Documentation**: Display code examples in documentation\r
2. **Code Review**: Preview code changes before committing\r
3. **Tutorial Creation**: Show code snippets in educational content\r
4. **API Response Display**: Format and display JSON/XML responses\r
5. **Log Viewing**: Display formatted log files\r
6. **Script Validation**: Preview generated scripts before execution\r
\r
## Example Configurations\r
\r
**Display JavaScript Code**\r
\r
\`\`\`\r
codeSource: function hello() { console.log("Hello World"); }\r
language: javascript\r
\`\`\`\r
\r
**Display Python Code**\r
\r
\`\`\`\r
codeSource: def hello(): print("Hello World")\r
language: python\r
\`\`\`\r
\r
**Display JSON Data**\r
\r
\`\`\`\r
codeSource: {"name": "John", "age": 30}\r
language: json\r
\`\`\`\r
\r
## Tips\r
\r
- Language is auto-detected from file extensions when using drag & drop\r
- Syntax highlighting improves code readability\r
- Metadata includes line count and complexity metrics\r
- Supports all major programming languages\r
- Use plaintext for unsupported languages\r
- Great for displaying API responses or generated code\r
\r
## Common Patterns\r
\r
**Code Generation Workflow**\r
\r
\`\`\`\r
1. Generate code with AI LLM\r
2. Pass to Code Preview for syntax highlighting\r
3. Review the generated code\r
4. Execute with Execute JavaScript/Python node\r
\`\`\`\r
\r
**API Response Formatting**\r
\r
\`\`\`\r
1. Make API request with Custom API\r
2. Pass JSON response to Code Preview\r
3. Set language to 'json' for formatting\r
4. Display formatted response\r
\`\`\`\r
\r
**Documentation Builder**\r
\r
\`\`\`\r
1. Fetch code examples from repository\r
2. Display with Code Preview\r
3. Combine with Markdown Preview for full docs\r
\`\`\`\r
\r
## Related Nodes\r
\r
- **Execute JavaScript**: For running JavaScript code\r
- **Execute Python**: For running Python code\r
- **HTML Preview**: For displaying HTML content\r
- **Markdown Preview**: For displaying markdown with code blocks\r
- **File System Operation**: For reading code files\r
\r
## Tags\r
\r
code, preview, syntax, highlighting, display, widget, programming, javascript, python, json\r
`;export{n as default};
