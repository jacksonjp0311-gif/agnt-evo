const e=`# Media Preview\r
\r
## Overview\r
\r
The **Media Preview** node is an advanced media display tool that renders images and videos from various sources including URLs, base64 data, and streaming platforms. It automatically detects media types, extracts metadata, and provides enhanced validation and optimization.\r
\r
## Category\r
\r
**Widget**\r
\r
## Parameters\r
\r
### mediaSource\r
\r
- **Type**: String (textarea)\r
- **Required**: Yes\r
- **Description**: Media URL, base64 data (with or without data URI prefix), or blob URL\r
- **Supported Formats**:\r
  - **Images**: jpg, png, gif, webp, bmp, svg\r
  - **Videos**: mp4, webm, mov, avi, mkv, wmv\r
  - **Streaming**: YouTube, Vimeo, and other streaming URLs\r
- **Features**: Automatically detects format from magic bytes for raw base64 data\r
\r
## Outputs\r
\r
### success\r
\r
- **Type**: Boolean\r
- **Description**: Whether the media was successfully processed\r
\r
### mediaType\r
\r
- **Type**: String\r
- **Description**: The detected media type ('image', 'video', or 'unknown')\r
\r
### originalUrl\r
\r
- **Type**: String\r
- **Description**: The original media URL before processing\r
\r
### base64Data\r
\r
- **Type**: String\r
- **Description**: Full data URI with prefix (data:image/jpeg;base64,abc123...) - ready for HTML display\r
\r
### metadata\r
\r
- **Type**: Object\r
- **Description**: Extracted media metadata including dimensions, format, file size, and processing info\r
\r
### fileSize\r
\r
- **Type**: Number\r
- **Description**: File size in bytes (calculated for base64 data, fetched for URLs)\r
\r
### dimensions\r
\r
- **Type**: Object\r
- **Description**: Image dimensions as {width, height} (when available)\r
\r
### format\r
\r
- **Type**: String\r
- **Description**: Detected media format/MIME type\r
\r
### error\r
\r
- **Type**: String\r
- **Description**: Error message if media processing failed\r
\r
## Use Cases\r
\r
1. **Image Display**: Show images from API responses or file uploads\r
2. **Video Playback**: Display videos from various sources\r
3. **Media Validation**: Verify media files before processing\r
4. **Thumbnail Generation**: Preview media content in workflows\r
5. **Streaming Integration**: Embed YouTube or Vimeo videos\r
6. **Base64 Conversion**: Display base64-encoded media\r
\r
## Example Configurations\r
\r
**Display Image from URL**\r
\r
\`\`\`\r
mediaSource: https://example.com/image.jpg\r
\`\`\`\r
\r
**Display Base64 Image**\r
\r
\`\`\`\r
mediaSource: data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA...\r
\`\`\`\r
\r
**Display YouTube Video**\r
\r
\`\`\`\r
mediaSource: https://www.youtube.com/watch?v=dQw4w9WgXcQ\r
\`\`\`\r
\r
**Display Local Video**\r
\r
\`\`\`\r
mediaSource: {{fileUpload.base64Data}}\r
\`\`\`\r
\r
## Tips\r
\r
- The node automatically detects media type from the source\r
- Base64 data can be provided with or without the data URI prefix\r
- Supports drag & drop for easy media upload\r
- Extracts metadata like dimensions and file size automatically\r
- Works with streaming platform URLs (YouTube, Vimeo, etc.)\r
- Handles both local and remote media sources\r
\r
## Common Patterns\r
\r
**Image Processing Pipeline**\r
\r
\`\`\`\r
1. Upload image via file input\r
2. Pass to Media Preview for validation\r
3. Use metadata.dimensions to verify size\r
4. Process or display the image\r
\`\`\`\r
\r
**Video Thumbnail Extraction**\r
\r
\`\`\`\r
1. Provide video URL to Media Preview\r
2. Extract metadata.format and metadata.fileSize\r
3. Use for video processing decisions\r
\`\`\`\r
\r
**Multi-Source Media Display**\r
\r
\`\`\`\r
1. Accept media from various sources (URL, base64, upload)\r
2. Media Preview normalizes and displays all formats\r
3. Use outputs for further processing\r
\`\`\`\r
\r
## Related Nodes\r
\r
- **HTML Preview**: For displaying HTML content\r
- **PDF Preview**: For displaying PDF documents\r
- **Code Preview**: For displaying code with syntax highlighting\r
- **File System Operation**: For reading local media files\r
- **Custom API Request**: For fetching media from APIs\r
\r
## Tags\r
\r
media, image, video, preview, display, widget, base64, streaming, youtube, vimeo\r
`;export{e as default};
