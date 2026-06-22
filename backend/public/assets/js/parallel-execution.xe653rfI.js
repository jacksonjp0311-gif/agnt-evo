const r=`# Parallel Execution ⚡\r
\r
## Id\r
\r
\`parallel-execution\`\r
\r
## Description\r
\r
Executes multiple workflow nodes simultaneously in parallel, significantly reducing execution time for independent tasks. Supports complex workflows by executing connected nodes following each parallel task and aggregating results from all parallel branches.\r
\r
## Tags\r
\r
parallel, execution, performance, concurrent, workflow, optimization\r
\r
## Input Parameters\r
\r
### Required\r
\r
- **tasks** (string): Comma-separated list of node names to execute in parallel\r
\r
## Output Format\r
\r
- **results** (array): Array of results from each parallel task execution\r
- **error** (string|null): Combined error messages from any failed parallel executions\r
`;export{r as default};
