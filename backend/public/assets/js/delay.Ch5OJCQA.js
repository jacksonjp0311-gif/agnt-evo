const n=`# Delay ⏱️\r
\r
## Id\r
\r
\`delay\`\r
\r
## Description\r
\r
Introduces a controlled pause in workflow execution for a specified duration. Supports multiple time units including milliseconds, seconds, minutes, and hours for flexible timing control.\r
\r
## Tags\r
\r
delay, timing, pause, wait, utility\r
\r
## Input Parameters\r
\r
### Required\r
\r
- **duration** (number): The amount of time to wait\r
- **unit** (string): The time unit for the duration (\`milliseconds\`, \`seconds\`, \`minutes\`, \`hours\`)\r
\r
## Output Format\r
\r
- **delayedUntil** (string): ISO timestamp indicating when the delay period will complete\r
`;export{n as default};
