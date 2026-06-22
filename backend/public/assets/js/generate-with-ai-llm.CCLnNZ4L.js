const e=`# Generate with AI LLM 🧠\r
\r
## Id\r
\r
\`generate-with-ai-llm\`\r
\r
## Description\r
\r
Generates text content using various AI language models including OpenAI GPT, Anthropic Claude, Google Gemini, and others. Supports custom prompts, temperature control, and multiple providers with comprehensive model selection.\r
\r
## Tags\r
\r
ai, llm, generation, gpt, claude, gemini, text, openai, anthropic\r
\r
## Input Parameters\r
\r
### Required\r
\r
- **prompt** (string): The prompt or instructions for AI generation\r
- **provider** (string): AI provider (\`anthropic\`, \`deepseek\`, \`gemini\`, \`grokai\`, \`groq\`, \`local\`, \`openai\`, \`togetherai\`)\r
\r
### Optional\r
\r
- **model** (string): Specific model to use (varies by provider)\r
- **maxTokens** (number, default=4096): Maximum tokens to generate\r
- **temperature** (number, default=0): Temperature for randomness (0-1)\r
- **parseJson** (boolean, default=false): Whether to parse JSON output\r
- **image** (object): Image data for vision models\r
\r
## Output Format\r
\r
- **generatedText** (string): The AI-generated content\r
- **tokenCount** (number): Number of tokens used\r
- **error** (string|null): Error message if generation failed\r
`;export{e as default};
