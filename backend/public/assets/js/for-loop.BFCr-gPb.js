const e=`# For Loop 🔁\r
\r
## Id\r
\r
\`for-loop\`\r
\r
## Description\r
\r
Executes a series of actions repeatedly based on a specified loop condition. Supports both range-based loops (e.g., 0 to 10) and list-based loops (e.g., iterating over an array of items). Each iteration can access loop-specific data like the current value and index.\r
\r
## Tags\r
\r
loop, iteration, control, workflow, repetition\r
\r
## Input Parameters\r
\r
### Required\r
\r
- **loopType** (string): The type of loop to execute (\`Range\` or \`List\`)\r
- **actions** (string): Comma-separated list of action names to execute in each iteration\r
\r
### Optional\r
\r
- **start** (number) [Range loop type operations only]: The starting value for range-based loops\r
- **end** (number) [Range loop type operations only]: The ending value for range-based loops\r
- **step** (number, default=1) [Range loop type operations only]: The increment step for range-based loops\r
- **list** (string) [List loop type operations only]: The list of items to iterate over for list-based loops (JSON array or comma-separated values)\r
- **initialValue** (number, default=0): The initial value for the currentIteration counter\r
\r
## Output Format\r
\r
- **iterations** (number): The total number of iterations in the loop\r
- **currentIteration** (number): The current iteration number (0-indexed)\r
- **results** (array): Array of results from each iteration, containing the results of all actions executed in that iteration\r
- **success** (boolean): Indicates whether the loop execution was successful\r
- **error** (string|null): Error message if the loop execution failed\r
`;export{e as default};
