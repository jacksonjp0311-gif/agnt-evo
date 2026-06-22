const e=`# AGNT: Open Source Tool Spec\r
\r
## System Overview\r
\r
AGNT is an open source workflow automation platform that enables users to create powerful automated workflows by connecting various tools, triggers, and actions. The system is designed with extensibility in mind, making it easy for developers to contribute new tools and integrations.\r
\r
## Core Architecture\r
\r
### Key Components\r
\r
- **Tool Library**: Collection of triggers, actions, utilities, and controls that can be used in workflows\r
- **Workflow Engine**: Executes workflows and handles data flow between tools\r
- **Auth System**: Manages API keys and OAuth connections for external services\r
- **Frontend Editor**: Visual editor for creating and managing workflows\r
\r
## Extending the System\r
\r
AGNT is designed to be easily extensible. Here's how you can add new capabilities:\r
\r
### Adding a New Tool\r
\r
1. Define the tool in the \`toolLibrary.json\` file\r
2. Create a JavaScript implementation file in the backend\r
3. Add necessary icons and UI elements to the frontend\r
\r
## MVP Getting Started Example\r
\r
Let's create a super simple "Hello World" tool:\r
\r
### 1. Define the Tool in toolLibrary.json\r
\r
<pre><code>{\r
  "title": "Hello World",\r
  "category": "action",\r
  "type": "hello-world",\r
  "icon": "smile",\r
  "description": "Outputs a simple greeting message",\r
  "parameters": {\r
    "name": {\r
      "type": "string",\r
      "inputType": "text",\r
      "description": "The name to greet"\r
    }\r
  },\r
  "outputs": {\r
    "greeting": {\r
      "type": "string",\r
      "description": "The greeting message"\r
    }\r
  }\r
}</code></pre>\r
\r
### 2. Create Backend Implementation\r
\r
Create a file at \`backend/workflow/tools/actions/hello-world.js\`:\r
\r
<pre><code>import BaseAction from "./BaseAction.js";\r
\r
class HelloWorld extends BaseAction {\r
  constructor() {\r
    super("hello-world");\r
  }\r
  \r
  async execute(params, inputData, workflowEngine) {\r
    // Create a simple greeting\r
    const name = params.name || "World";\r
    return { greeting: \`Hello, \${name}!\` };\r
  }\r
}\r
\r
export default new HelloWorld();</code></pre>\r
\r
### 3. Use in a Workflow\r
\r
With just these two simple files, users can now include your tool in their workflows:\r
\r
1. Drag the "Hello World" action into the workflow canvas\r
2. Enter a name in the parameter field\r
3. Connect the output to other tools in the workflow\r
\r
That's it! Your tool is now ready to use in any workflow.\r
\r
## Core Principles for Contributors\r
\r
- **Simplicity First**: Keep tool implementations simple and focused\r
- **Reusability**: Design tools that can be used in multiple contexts\r
- **Clear Documentation**: Document parameters, outputs, and examples\r
- **Error Handling**: Implement robust error handling in all tools\r
- **Performance**: Consider the performance impact of your implementations\r
\r
## Next Steps\r
\r
For more advanced customization:\r
\r
- Add OAuth integrations for external services\r
- Create custom triggers that listen for specific events\r
- Develop domain-specific utility tools\r
- Contribute to the core workflow engine\r
\r
This specification provides a foundation for understanding and extending the AGNT platform. The simple "Hello World" example demonstrates how quickly new capabilities can be added to the system, making it ideal for open source collaboration and community contributions.`;export{e as default};
