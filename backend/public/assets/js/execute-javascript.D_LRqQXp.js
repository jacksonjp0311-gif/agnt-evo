const e=`# Execute JavaScript 💻\r
\r
## Id\r
\r
\`execute-javascript\`\r
\r
## Description\r
\r
Executes JavaScript code in a secure isolated environment. The code runs in a separate child process with a timeout of 60 seconds for safety. It can access input data and workflow engine database if provided.\r
\r
## Tags\r
\r
javascript, execution, code, utility, programming\r
\r
## Input Parameters\r
\r
### Required\r
\r
- **code** (string): The JavaScript code to execute\r
\r
## Output Format\r
\r
- **success** (boolean): Indicates whether the JavaScript execution was successful\r
- **result** (any): The result returned by the executed JavaScript code\r
- **error** (string|null): Error message if the JavaScript execution failed\r
- **outputs** (any): The result returned by the executed JavaScript code (duplicate of result for compatibility)\r
`;export{e as default};
