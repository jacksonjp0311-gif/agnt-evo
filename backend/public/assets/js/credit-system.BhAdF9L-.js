const e=`# Workflow Execution Credit System\r
\r
## Overview\r
\r
Our workflow execution system uses AGNT tokens to measure and track resource usage. AGNT tokens are calculated based on the execution time of each node within a workflow.\r
\r
## Credit Calculation\r
\r
- **Base Rate**: 1 second of execution time = 1 AGNT token = $0.01\r
- **Conversion**: Simple 1:1:0.01 ratio (time:AGNT:USD)\r
\r
## How to Read Credit Usage\r
\r
To understand the cost and duration from AGNT tokens used:\r
\r
1. AGNT tokens directly correspond to seconds of execution time\r
2. Multiply AGNT tokens by $0.01 to get the cost in USD\r
3. Example: 14 AGNT = 14 seconds of execution time = $0.14\r
\r
## Time to AGNT to Cost Conversion Table\r
\r
| Execution Time | AGNT Tokens | Cost (USD) |\r
|----------------|-------------|------------|\r
| 1 second       | 1           | $0.01      |\r
| 10 seconds     | 10          | $0.10      |\r
| 30 seconds     | 30          | $0.30      |\r
| 60 seconds     | 60          | $0.60      |\r
| 300 seconds    | 300         | $3.00      |\r
\r
## Important Notes\r
\r
1. AGNT tokens are calculated for each node execution individually.\r
2. The total workflow cost is the sum of all node execution tokens.\r
3. AGNT credits are measured to the thousandth decimal place (e.g., 14.374 AGNT).\r
4. Idle time or delays between node executions are not charged.\r
\r
## Example\r
\r
If a workflow execution shows 35.742 AGNT tokens used:\r
- This corresponds to 35.742 seconds of total execution time across all nodes\r
- The cost would be $0.36 (35.742 * $0.01)\r
- Individual node usage can be read directly in seconds from their AGNT token count\r
\r
Remember, this system provides a straightforward way to measure resource usage and cost based on execution time. It allows for precise tracking, even for very short operations.`;export{e as default};
