const n=`# Agent Chat 🤖\r
\r
## Id\r
\r
\`agnt-agent\`\r
\r
## Description\r
\r
Chat with an AI agent from your agent library. Select an agent and send messages to interact with it within your workflow. The agent maintains conversation history and can execute assigned tools to perform complex tasks autonomously.\r
\r
## Tags\r
\r
agent, chat, ai, conversation, tools, automation, workflow\r
\r
## Input Parameters\r
\r
### Required\r
\r
- **agentId** (string): Select the agent to chat with from your agent library\r
- **message** (string): The message to send to the agent\r
\r
### Optional\r
\r
- **conversationHistory** (array): Previous conversation messages for context (automatically managed by the workflow)\r
\r
## Output Format\r
\r
- **success** (boolean): Whether the chat was successful\r
- **response** (string): The agent's response message\r
- **agentId** (string): The ID of the agent that responded\r
- **conversationId** (string): Unique conversation ID for tracking the chat session\r
- **toolExecutions** (array): Array of tools executed by the agent with their inputs and outputs\r
- **toolsUsed** (number): Number of tools used by the agent during the conversation\r
- **conversationHistory** (array): Updated conversation history including the new message and response\r
- **error** (string|null): Error message if the chat failed\r
`;export{n as default};
