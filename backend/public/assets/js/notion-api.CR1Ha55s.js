const r=`# Notion API 📝\r
\r
## Id\r
\r
\`notion-api\`\r
\r
## Description\r
\r
Manages Notion workspaces with comprehensive database and page operations. Supports searching, querying databases, creating pages, and managing content. Uses OAuth authentication for secure Notion integration.\r
\r
## Tags\r
\r
notion, api, database, pages, workspace, oauth, content\r
\r
## Input Parameters\r
\r
### Required\r
\r
- **operation** (string): Action to perform (\`search\`, \`getDatabaseList\`, \`queryDatabase\`, \`getPageContent\`, \`createPage\`)\r
\r
### Optional\r
\r
- **query** (string): Search query for search operations\r
- **databaseId** (string): Database ID for database operations\r
- **pageId** (string): Page ID for page operations\r
- **parentId** (string): Parent ID for new pages\r
- **parentType** (string): Parent type (\`database\` or \`page\`)\r
- **properties** (string): JSON properties for new pages\r
- **content** (string): JSON content for new pages\r
- **filter** (object): Filter criteria for database queries\r
- **sorts** (array): Sort criteria for database queries\r
\r
## Output Format\r
\r
- **success** (boolean): Whether the Notion operation was successful\r
- **result** (object): Operation result including search results, page data, or database records\r
- **error** (string|null): Error message if the operation failed\r
`;export{r as default};
