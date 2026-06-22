const e=`# Image Preview 🖼️\r
\r
## Id\r
\r
\`image-preview\`\r
\r
## Description\r
\r
Validates and prepares image data for display in workflows. Supports both URL-based images and base64-encoded image data. Provides basic validation to ensure image sources are properly formatted for frontend rendering.\r
\r
## Tags\r
\r
image, preview, utility, display, validation, base64\r
\r
## Input Parameters\r
\r
### Required\r
\r
- **imageSource** (string): The image source - can be a URL (http/https) or base64-encoded image data\r
\r
## Output Format\r
\r
- **success** (boolean): Indicates whether the image source is valid\r
- **imageUrl** (string|null): The validated image source ready for display\r
- **error** (string|null): Error message if the image source is invalid\r
`;export{e as default};
