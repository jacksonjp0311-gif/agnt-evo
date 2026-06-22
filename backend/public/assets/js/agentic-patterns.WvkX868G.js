const n=`# Explore Common Agentic Patterns\r
\r
This guide explores common patterns you can use as building blocks for your own workflows. Understanding these patterns will help you design more effective and maintainable automations.\r
\r
## Simple Agent\r
\r
The simple agent pattern is a basic pattern where an agent is created and executed in a single step. This pattern is useful for simple tasks that don't require any additional steps or complex logic.\r
\r
![Simple Agent](/images/patterns/recipe-simple-agent.png)\r
\r
## Prompt Chain\r
\r
Prompt chaining involves connecting multiple prompts in sequence, where the output of one prompt becomes the input for the next. This pattern is useful for breaking down complex tasks into smaller, manageable steps.\r
\r
![Prompt Chaining](/images/patterns/recipe-prompt-chaining.png)\r
\r
## Conditional Execution\r
\r
Conditional execution allows an agent to execute a task only if a certain condition is met. This pattern is useful for ensuring that an agent only performs a task when it is necessary.\r
\r
![Conditional Execution](/images/patterns/recipe-conditional.png)\r
\r
## Routing\r
\r
An expansion on the conditional execution pattern, routing involves directing inputs to specific agents based on certain criteria. This pattern helps in efficiently handling diverse tasks by sending them to specialized agents.\r
\r
![Routing](/images/patterns/recipe-routing.png)\r
\r
## Aggregation\r
\r
The aggregation pattern is a way to combine multiple inputs into a single output. This pattern is useful for when a step needs to combine multiple inputs into a single output.\r
\r
![Aggregation](/images/patterns/recipe-aggregation.png)\r
\r
## Looping\r
\r
The looping pattern is a way to create a loop in a workflow. This pattern is useful for when a step needs to be repeated until certain conditions are met.\r
\r
**DANGER:** Be careful with this pattern. It can easily create an infinite loop!\r
\r
![Looping](/images/patterns/recipe-agent-critic.png)\r
\r
\r
**PRO TIP:** Use the looping pattern in combination with the prompt chaining and conditional execution patterns to create the "Agent Critic" pattern. This pattern allows the agent to review its own output and improve on it recursively. \r
`;export{n as default};
