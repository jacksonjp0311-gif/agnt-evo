const e=`# File System Operation 📁\r
\r
## Id\r
\r
\`file-system-operation\`\r
\r
## Description\r
\r
Provides comprehensive file system operations including reading, writing, appending, listing directories, and executing files. Supports multiple file types and formats with automatic encoding detection for text files and base64 encoding for binary files.\r
\r
## Tags\r
\r
file, system, utility, read, write, execute, directory, filesystem\r
\r
## Input Parameters\r
\r
### Required\r
\r
- **rootDirectory** (string): Base directory path for file operations\r
- **operation** (string): The file operation to perform (\`readFile\`, \`writeFile\`, \`appendFile\`, \`listFiles\`, \`executeFile\`)\r
- **path** (string): Relative file path from rootDirectory\r
\r
### Optional\r
\r
- **content** (string) [writeFile/appendFile operations only]: Content to write or append to the file\r
\r
## Output Format\r
\r
- **success** (boolean): Indicates whether the file operation was successful\r
- **result** (any): The result of the file operation (file content, directory listing, or execution output)\r
- **error** (string|null): Error message if the file operation failed\r
`;export{e as default};
