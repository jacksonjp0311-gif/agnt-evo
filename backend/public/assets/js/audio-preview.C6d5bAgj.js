const r=`# Audio Preview\r
\r
## Overview\r
\r
The **Audio Preview** node provides an audio player with waveform visualization. It supports multiple audio formats including MP3, WAV, OGG, WebM, AAC, and M4A up to 10MB, making it perfect for playing and analyzing audio files in workflows.\r
\r
## Category\r
\r
**Widget**\r
\r
## Parameters\r
\r
### audioSource\r
\r
- **Type**: String (textarea)\r
- **Required**: Yes\r
- **Description**: Audio source\r
- **Supported Formats**:\r
  - URL (http:// or https://)\r
  - Blob URL (blob://)\r
  - Base64 data (data:audio/...)\r
- **Supported Audio Types**:\r
  - MP3 (.mp3)\r
  - WAV (.wav)\r
  - OGG (.ogg)\r
  - WebM (.webm)\r
  - AAC (.aac)\r
  - M4A (.m4a)\r
- **Features**: Supports drag & drop of audio files\r
- **Size Limit**: Up to 10MB\r
\r
## Outputs\r
\r
### success\r
\r
- **Type**: Boolean\r
- **Description**: Whether the audio was successfully processed\r
\r
### audioUrl\r
\r
- **Type**: String\r
- **Description**: The audio URL ready for playback\r
\r
### metadata\r
\r
- **Type**: Object\r
- **Description**: Audio metadata including:\r
  - Source type (url, blob, base64)\r
  - File size in bytes\r
  - Duration in seconds (when available)\r
  - Format/MIME type\r
  - Bitrate (when available)\r
  - Sample rate (when available)\r
\r
### error\r
\r
- **Type**: String\r
- **Description**: Error message if audio processing failed\r
\r
## Use Cases\r
\r
1. **Audio Playback**: Play audio files from various sources\r
2. **Voice Message Display**: Play recorded voice messages\r
3. **Music Preview**: Preview music tracks before processing\r
4. **Podcast Player**: Display and play podcast episodes\r
5. **Audio Analysis**: Visualize audio waveforms\r
6. **TTS Output**: Play text-to-speech generated audio\r
\r
## Example Configurations\r
\r
**Play Audio from URL**\r
\r
\`\`\`\r
audioSource: https://example.com/audio.mp3\r
\`\`\`\r
\r
**Play Base64 Audio**\r
\r
\`\`\`\r
audioSource: data:audio/mp3;base64,//uQxAAAAAAAAAAAAAAASW5mbwAAAA8AAAA...\r
\`\`\`\r
\r
**Play Generated Audio**\r
\r
\`\`\`\r
audioSource: {{textToSpeech.audioUrl}}\r
\`\`\`\r
\r
## Tips\r
\r
- Maximum file size is 10MB for optimal performance\r
- Waveform visualization provides visual feedback\r
- Supports all common audio formats\r
- Base64 audio is automatically converted for playback\r
- Metadata extraction includes duration and bitrate\r
- Drag & drop support for easy file upload\r
- Works with both local and remote audio sources\r
\r
## Common Patterns\r
\r
**Text-to-Speech Workflow**\r
\r
\`\`\`\r
1. Generate speech with Text to Speech node\r
2. Pass audio output to Audio Preview\r
3. Play and review the generated audio\r
4. Save or share if approved\r
\`\`\`\r
\r
**Voice Message Processing**\r
\r
\`\`\`\r
1. Receive voice message from API\r
2. Display with Audio Preview\r
3. Transcribe if needed\r
4. Store or forward the message\r
\`\`\`\r
\r
**Audio Quality Check**\r
\r
\`\`\`\r
1. Upload audio file\r
2. Display with Audio Preview\r
3. Check metadata.bitrate and metadata.duration\r
4. Process based on quality metrics\r
\`\`\`\r
\r
## Related Nodes\r
\r
- **Text to Speech**: For generating audio from text\r
- **Custom API Request**: For fetching audio from APIs\r
- **File System Operation**: For reading local audio files\r
- **Media Preview**: For displaying images and videos\r
- **Send Email**: For emailing audio files\r
\r
## Tags\r
\r
audio, preview, player, sound, music, voice, widget, waveform, mp3, wav\r
`;export{r as default};
