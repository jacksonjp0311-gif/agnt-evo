const r=`# Run Workflow 🔄\r
\r
## Id\r
\r
\`run-workflow\`\r
\r
## Description\r
\r
Executes another workflow as a sub-workflow within the current workflow execution. Supports passing data between parent and child workflows, enabling modular workflow design and reusability. Automatically handles workflow ownership verification and merges input data from both workflows.\r
\r
## Tags\r
\r
sub-workflow, execution, modular, reusable, workflow, chaining\r
\r
## Input Parameters\r
\r
### Required\r
\r
- **workflowId** (string): Unique identifier of the workflow to execute as a sub-workflow\r
- **inputData** (object|string): Input data to pass to the sub-workflow (can be JSON object or string)\r
\r
## Output Format\r
\r
- **success** (boolean): Indicates whether the sub-workflow execution was successful\r
- **outputs** (object): Combined outputs from the sub-workflow execution\r
- **errors** (object): Any errors encountered during sub-workflow execution\r
- **subWorkflowCompleted** (boolean): Always true when execution completes\r
- **message** (string): Status message indicating completion status\r
`;export{r as default};
