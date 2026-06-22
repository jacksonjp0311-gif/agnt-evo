const r=`# Stop Workflow 🛑\r
\r
## Id\r
\r
\`stop-workflow\`\r
\r
## Description\r
\r
Immediately terminates the current workflow execution with a customizable stop reason. Useful for conditional workflow termination, error handling, or early exit scenarios. Provides clear feedback about why the workflow was stopped.\r
\r
## Tags\r
\r
stop, terminate, exit, control, workflow, termination\r
\r
## Input Parameters\r
\r
### Required\r
\r
- **reason** (string, default='Workflow stopped by Stop Workflow node'): Custom message explaining why the workflow was stopped\r
\r
## Output Format\r
\r
- **stopped** (boolean): Always true to indicate successful workflow termination\r
- **reason** (string): The provided stop reason message\r
`;export{r as default};
