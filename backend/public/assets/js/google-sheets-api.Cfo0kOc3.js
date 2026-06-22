const e=`# Google Sheets API 📊\r
\r
## Id\r
\r
\`google-sheets-api\`\r
\r
## Description\r
\r
Manages Google Sheets with full spreadsheet operations including reading, writing, appending, and clearing data. Supports OAuth authentication and handles complex data structures with JSON parsing capabilities.\r
\r
## Tags\r
\r
google-sheets, spreadsheet, api, data, oauth, crud\r
\r
## Input Parameters\r
\r
### Required\r
\r
- **operation** (string): Action to perform (\`Read\`, \`Write\`, \`Append\`, \`Clear\`)\r
- **spreadsheetId** (string): Google Sheets spreadsheet ID\r
- **range** (string): Cell range to operate on (e.g., "Sheet1!A1:D5")\r
\r
### Optional\r
\r
- **values** (string|array): Data values as JSON string or array for write/append operations\r
\r
## Output Format\r
\r
- **success** (boolean): Whether the Google Sheets operation was successful\r
- **result** (object): Operation result including cell data or update confirmations\r
- **error** (string|null): Error message if the operation failed\r
`;export{e as default};
