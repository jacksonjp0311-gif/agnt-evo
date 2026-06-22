const r=`# Google Drive API ☁️\r
\r
## Id\r
\r
\`google-drive-api\`\r
\r
## Description\r
\r
Manages Google Drive files and folders with full CRUD operations. Supports file uploads/downloads, folder creation, sharing, and metadata retrieval. Uses OAuth authentication for secure Google Drive integration.\r
\r
## Tags\r
\r
google-drive, storage, files, cloud, api, oauth, sharing\r
\r
## Input Parameters\r
\r
### Required\r
\r
- **action** (string): Action to perform (\`LIST_FILES\`, \`UPLOAD_FILE\`, \`DOWNLOAD_FILE\`, \`CREATE_FOLDER\`, \`DELETE_FILE\`, \`MOVE_FILE\`, \`GET_FILE_INFO\`, \`SHARE_FILE\`)\r
- **fileName** (string): File or folder name for operations\r
\r
### Optional\r
\r
- **folderId** (string): Parent folder ID for operations\r
- **fileContent** (string): File content for uploads\r
- **destinationFolderId** (string): Destination folder for move operations\r
- **shareEmail** (string): Email address for sharing\r
- **shareRole** (string): Sharing role (\`reader\`, \`writer\`, \`owner\`)\r
\r
## Output Format\r
\r
- **success** (boolean): Whether the Google Drive operation was successful\r
- **result** (object): Operation result including file IDs, download URLs, or share links\r
- **error** (string|null): Error message if the operation failed\r
`;export{r as default};
