const r=`# GitHub API 🐙\r
\r
## Id\r
\r
\`github-api\`\r
\r
## Description\r
\r
Manages GitHub repositories with full repository operations including issues, pull requests, branches, releases, and file management. Supports repository CRUD operations and comprehensive GitHub workflow automation.\r
\r
## Tags\r
\r
github, api, repository, issues, pull-requests, branches, releases, git\r
\r
## Input Parameters\r
\r
### Required\r
\r
- **action** (string): Action to perform (\`CREATE_ISSUE\`, \`CREATE_PR\`, \`GET_REPO_INFO\`, \`CREATE_BRANCH\`, \`MERGE_PR\`, \`LIST_PRS\`, \`GET_PR_CHANGES\`, \`ADD_LABELS\`, \`REMOVE_LABELS\`, \`GET_FILE_CONTENT\`, \`GET_REPO_CONTENTS\`, \`CREATE_FILE\`, \`UPDATE_FILE\`, \`CREATE_RELEASE\`, \`LIST_COMMITS\`)\r
- **owner** (string): Repository owner/organization\r
- **repo** (string): Repository name\r
\r
### Optional\r
\r
- **title** (string): Issue or PR title\r
- **body** (string): Issue or PR description\r
- **head** (string): Source branch for PRs\r
- **base** (string): Target branch for PRs\r
- **pullNumber** (number): Pull request number\r
- **filePath** (string): File path for file operations\r
- **content** (string): File content for create/update operations\r
- **tagName** (string): Release tag name\r
- **releaseName** (string): Release name\r
- **releaseNotes** (string): Release description\r
\r
## Output Format\r
\r
- **success** (boolean): Whether the GitHub operation was successful\r
- **result** (object): Operation result including issue numbers, PR URLs, file URLs, or commit lists\r
- **error** (string|null): Error message if the operation failed\r
`;export{r as default};
