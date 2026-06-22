const r=`# Twitter API 🐦\r
\r
## Id\r
\r
\`twitter-api\`\r
\r
## Description\r
\r
Manages Twitter accounts with comprehensive social media operations including posting tweets, managing followers, searching content, and monitoring engagement. Supports OAuth authentication for secure Twitter integration.\r
\r
## Tags\r
\r
twitter, api, social-media, tweets, followers, search, engagement, oauth\r
\r
## Input Parameters\r
\r
### Required\r
\r
- **action** (string): Action to perform (\`POST\`, \`DELETE\`, \`REPLY\`, \`LIKE\`, \`GET_TIMELINE\`, \`SEARCH\`, \`GET_PROFILE\`, \`GET_TWEETS\`, \`MONITOR_REPLIES\`, \`FOLLOW\`, \`UNFOLLOW\`, \`BULK_UNFOLLOW\`, \`CHECK_MENTIONS\`)\r
\r
### Optional\r
\r
- **text** (string): Tweet content for posting\r
- **tweetId** (string): Tweet ID for operations\r
- **userId** (string): Username for profile/timeline operations\r
- **query** (string): Search query for search operations\r
- **maxResults** (number): Maximum results for search operations\r
- **targetUserId** (string): Target username for follow/unfollow operations\r
- **userIds** (array): Array of usernames for bulk operations\r
\r
## Output Format\r
\r
- **success** (boolean): Whether the Twitter operation was successful\r
- **result** (object): Operation result including tweet data, user profiles, search results, or engagement metrics\r
- **error** (string|null): Error message if the operation failed\r
`;export{r as default};
