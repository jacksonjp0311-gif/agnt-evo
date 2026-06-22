const r=`# AI Browser Use 🤖\r
\r
## Id\r
\r
\`ai-browser-use\`\r
\r
## Description\r
\r
Uses AI-powered browser automation to perform web browsing tasks. Supports multiple AI providers (OpenAI, Gemini, DeepSeek) and can generate GIF recordings of browser sessions. Features browser reuse for efficiency and comprehensive error handling.\r
\r
## Tags\r
\r
ai, browser, automation, web, scraping, gpt, gemini, deepseek\r
\r
## Input Parameters\r
\r
### Required\r
\r
- **instructions** (string): Detailed instructions for the AI agent to perform\r
- **provider** (string): AI provider to use (\`openai\`, \`gemini\`, \`deepseek\`)\r
\r
### Optional\r
\r
- **reuseBrowser** (boolean, default=false): Whether to reuse browser sessions for efficiency\r
\r
## Output Format\r
\r
- **success** (boolean): Whether the browser automation was successful\r
- **result** (string): The output from the AI agent's task execution\r
- **gifPath** (string|null): Path to generated GIF recording of the browser session\r
- **error** (string|null): Error message if the operation failed\r
`;export{r as default};
