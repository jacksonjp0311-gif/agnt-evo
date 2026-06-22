const e=`# Google Sheets Receiver 📊\r
\r
## Id\r
\r
\`sheets-receiver\`\r
\r
## Description\r
\r
Monitors Google Sheets for new row additions and triggers workflows when new data is detected. Uses OAuth authentication to access user-specific Google Sheets and polls for changes at regular intervals.\r
\r
## Tags\r
\r
google-sheets, trigger, spreadsheet, data, polling, oauth\r
\r
## Input Parameters\r
\r
### Required\r
\r
- **spreadsheetId** (string): The Google Sheets spreadsheet ID (found in the URL)\r
- **sheetName** (string): The specific sheet/tab name to monitor for new rows\r
\r
### Optional\r
\r
- **pollInterval** (number, default=30000): Time in milliseconds between checks for new rows\r
\r
## Output Format\r
\r
- **newRow** (array): Array of cell values from the newly added row\r
- **rowNumber** (number): The row number where new data was detected\r
- **timestamp** (string): ISO timestamp when the new row was detected\r
`;export{e as default};
