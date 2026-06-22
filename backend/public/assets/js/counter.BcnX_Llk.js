const n=`# Counter 🔢\r
\r
## Id\r
\r
\`counter\`\r
\r
## Description\r
\r
Maintains and increments a counter value that persists across workflow executions. Useful for tracking iterations, creating sequential IDs, or counting events within workflows.\r
\r
## Tags\r
\r
counter, utility, state, increment, tracking\r
\r
## Input Parameters\r
\r
### Required\r
\r
- **initialValue** (number, default=0): The starting value for the counter when first initialized\r
\r
### Optional\r
\r
- **count** (number): Current count value from previous executions to maintain state\r
\r
## Output Format\r
\r
- **count** (number): The incremented counter value\r
`;export{n as default};
