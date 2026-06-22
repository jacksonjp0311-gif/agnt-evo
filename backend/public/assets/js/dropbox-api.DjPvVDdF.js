const r=`# Dropbox API 📦\r
\r
## Id\r
\r
\`dropbox-api\`\r
\r
## Description\r
\r
Manages files and folders in Dropbox with full CRUD operations. Supports file uploads/downloads, folder management, shared links, and metadata retrieval. Uses OAuth authentication for secure Dropbox integration.\r
\r
## Tags\r
\r
dropbox, storage, files, cloud, api, oauth\r
\r
## Input Parameters\r
\r
### Required\r
\r
- **action** (string): Action to perform (\`LIST_FOLDER\`, \`UPLOAD_FILE\`, \`DOWNLOAD_FILE\`, \`DELETE_FILE\`, \`MOVE_FILE\`, \`CREATE_FOLDER\`, \`GET_FILE_METADATA\`, \`CREATE_SHARED_LINK\`)\r
- **path** (string): File or folder path in Dropbox\r
\r
### Optional\r
\r
- **content** (string): Base64-encoded file content for uploads\r
- **newPath** (string): Destination path for move operations\r
- **fileName** (string): Name for uploaded files\r
\r
## Output Format\r
\r
- **success** (boolean): Whether the Dropbox operation was successful\r
- **result** (object): Operation result including file metadata, download URLs, or shared links\r
- **error** (string|null): Error message if the operation failed\r
`;export{r as default};
