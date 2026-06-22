const r=`# Unsplash API 📸\r
\r
## Id\r
\r
\`unsplash-api\`\r
\r
## Description\r
\r
Accesses Unsplash's vast photo library with comprehensive search and download capabilities. Supports photo searches, random photos, collections, user profiles, and direct downloads with proper attribution.\r
\r
## Tags\r
\r
unsplash, photos, api, images, search, download, photography\r
\r
## Input Parameters\r
\r
### Required\r
\r
- **action** (string): Action to perform (\`SEARCH_PHOTOS\`, \`GET_RANDOM_PHOTO\`, \`GET_PHOTO\`, \`LIST_PHOTOS\`, \`GET_COLLECTIONS\`, \`GET_COLLECTION_PHOTOS\`, \`GET_USER_PROFILE\`, \`GET_USER_PHOTOS\`, \`DOWNLOAD_PHOTO\`)\r
\r
### Optional\r
\r
- **query** (string): Search query for photo searches\r
- **username** (string): Username for user-specific operations\r
- **photoId** (string): Photo ID for specific photo operations\r
- **collectionId** (string): Collection ID for collection operations\r
- **page** (number): Page number for pagination\r
- **perPage** (number): Results per page (1-30)\r
- **orientation** (string): Photo orientation (\`landscape\`, \`portrait\`, \`squarish\`)\r
- **color** (string): Color filter for photos\r
- **orderBy** (string): Sort order (\`latest\`, \`oldest\`, \`popular\`, \`relevant\`)\r
\r
## Output Format\r
\r
- **success** (boolean): Whether the Unsplash operation was successful\r
- **result** (object): Operation result including photo data, URLs, metadata, or download links\r
- **error** (string|null): Error message if the operation failed\r
`;export{r as default};
