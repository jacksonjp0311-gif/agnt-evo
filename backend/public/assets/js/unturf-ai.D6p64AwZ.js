const e=`# Unturf AI 🤖\r
\r
## Id\r
\r
\`unturf-ai\`\r
\r
## Description\r
\r
Accesses Unturf AI services for LLM text generation and text-to-speech conversion. Supports multiple AI models and voices with comprehensive API integration for both text and audio generation.\r
\r
## Tags\r
\r
unturf, ai, llm, tts, text-to-speech, generation, api\r
\r
## Input Parameters\r
\r
### Required\r
\r
- **service** (string): Service type (\`LLM\` or \`Text-to-Speech\`)\r
- **prompt** (string): Prompt for LLM service (required when service=LLM)\r
- **text** (string): Text for TTS service (required when service=Text-to-Speech)\r
- **voice** (string): Voice for TTS service (required when service=Text-to-Speech)\r
\r
### Optional\r
\r
- **model** (string): AI model for LLM service\r
- **temperature** (number): Temperature for LLM (default varies)\r
- **maxTokens** (number): Maximum tokens for LLM\r
- **speed** (number): Speech speed for TTS (0.25-4.0)\r
\r
## Output Format\r
\r
- **success** (boolean): Whether the Unturf AI operation was successful\r
- **result** (string): Generated text or base64-encoded audio\r
- **error** (string|null): Error message if the operation failed\r
\r
## More Information\r
\r
Visit [Unturf Software](https://www.unturf.com/software/) for more information about available models, endpoints, and API documentation.\r
\r
### Available Endpoints:\r
\r
- **Hermes**: https://hermes.ai.unturf.com/v1 - General purpose conversational AI\r
- **Qwen 3 Coder**: https://qwen.ai.unturf.com/v1 - Specialized coding model\r
- **TTS**: https://speech.ai.unturf.com/v1 - Text-to-speech generation\r
\r
### Available Models:\r
\r
- \`adamo1139/Hermes-3-Llama-3.1-8B-FP8-Dynamic\` - Fast general purpose model\r
- \`NousResearch/Hermes-3-Llama-3.1-8B\` - Alternative Hermes model\r
- \`hf.co/unsloth/Qwen3-Coder-30B-A3B-Instruct-GGUF:Q4_K_M\` - Specialized coding model\r
`;export{e as default};
