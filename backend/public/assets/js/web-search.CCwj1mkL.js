const r=`# Web Search 🔍\r
\r
## Id\r
\r
\`web-search\`\r
\r
## Description\r
\r
Performs web searches using Google Custom Search API to retrieve relevant results based on a query.\r
\r
## Tags\r
\r
search, web, research, information-retrieval\r
\r
## Input Parameters\r
\r
### Required\r
\r
- **searchQuery** (string): The search query to look up\r
\r
### Optional\r
\r
- **numResults** (number, default=5): Number of results to return\r
- **sort** (string, default="relevance"): Sort order for results\r
\r
## Output Format\r
\r
- **success** (boolean): Whether the search was successful\r
- **results** (array): Array of search results with title, link, and snippet\r
- **error** (string|null): Error message if the search failed\r
`;export{r as default};
