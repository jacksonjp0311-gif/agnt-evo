const r=`# Web Scrape 🕷️\r
\r
## Id\r
\r
\`web-scrape\`\r
\r
## Description\r
\r
Performs comprehensive web scraping using headless browser automation. Extracts clean text content, all links, and code snippets from web pages. Features intelligent content filtering and robust error handling for reliable data extraction.\r
\r
## Tags\r
\r
web-scraping, browser, automation, content, links, code, extraction\r
\r
## Input Parameters\r
\r
### Required\r
\r
- **url** (string): URL to scrape (automatically adds https:// if missing)\r
\r
## Output Format\r
\r
- **success** (boolean): Whether the scraping was successful\r
- **textContent** (string): Clean extracted text content\r
- **links** (array): All extracted links from the page\r
- **codeContent** (string): All code snippets found on the page\r
- **error** (string|null): Error message if scraping failed\r
`;export{r as default};
