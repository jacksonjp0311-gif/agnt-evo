const e=`# Google Slides API 🎯\r
\r
## Id\r
\r
\`google-slides-api\`\r
\r
## Description\r
\r
Manages Google Slides presentations with full CRUD operations. Supports creating presentations, managing slides, adding content, images, and formatting. Uses OAuth authentication for secure Google Slides integration.\r
\r
## Tags\r
\r
google-slides, presentation, api, slides, content, oauth\r
\r
## Input Parameters\r
\r
### Required\r
\r
- **action** (string): Action to perform (\`Create Presentation\`, \`Read Presentation\`, \`Update Presentation\`, \`Delete Presentation\`, \`Create Slide\`, \`Read Slide\`, \`Update Slide\`, \`Delete Slide\`)\r
- **presentationId** (string): Google Slides presentation ID\r
\r
### Optional\r
\r
- **title** (string): Presentation title\r
- **slideId** (string): Specific slide ID for operations\r
- **slideContent** (string): JSON content for slide creation/updates\r
- **newFolderName** (string): Name for new folders\r
\r
## Output Format\r
\r
- **success** (boolean): Whether the Google Slides operation was successful\r
- **result** (object): Operation result including presentation data, slide information, or update confirmations\r
- **error** (string|null): Error message if the operation failed\r
`;export{e as default};
