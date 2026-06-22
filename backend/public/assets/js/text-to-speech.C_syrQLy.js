const e=`# Text to Speech 🔊\r
\r
## Id\r
\r
\`text-to-speech\`\r
\r
## Description\r
\r
Converts text to natural-sounding speech using OpenAI's TTS API. Supports multiple voices and languages with configurable speed and chunking for long texts. Features retry mechanisms and comprehensive error handling.\r
\r
## Tags\r
\r
tts, speech, audio, openai, voice, synthesis\r
\r
## Input Parameters\r
\r
### Required\r
\r
- **text** (string): Text content to convert to speech (max 4096 characters)\r
- **voice** (string): Voice to use (alloy, echo, fable, onyx, nova, shimmer)\r
\r
### Optional\r
\r
- **speed** (number, default=1.0): Speech speed (0.25-4.0)\r
\r
## Output Format\r
\r
- **success** (boolean): Whether the text-to-speech conversion was successful\r
- **result** (object): Audio content as base64-encoded MP3\r
- **contentType** (string): Audio format (audio/mpeg)\r
- **error** (string|null): Error message if conversion failed\r
`;export{e as default};
