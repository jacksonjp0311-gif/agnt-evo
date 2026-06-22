const e=`# Execute Python 🐍\r
\r
## Id\r
\r
\`execute-python\`\r
\r
## Description\r
\r
Executes Python code in a secure sandboxed environment with built-in safety restrictions. Supports standard Python libraries and provides access to workflow data. Features 60-second timeout protection and comprehensive error handling for safe code execution.\r
\r
## Tags\r
\r
python, execution, code, utility, sandbox\r
\r
## Input Parameters\r
\r
### Required\r
\r
- **code** (string): The Python code to execute (must define a 'result' variable)\r
\r
## Output Format\r
\r
- **success** (boolean): Indicates whether the Python execution was successful\r
- **result** (any): The value of the 'result' variable from executed code\r
- **output** (string): Console output from the Python execution\r
- **error** (string|null): Error message if Python execution failed\r
`;export{e as default};
