const r=`# PDF Preview\r
\r
## Overview\r
\r
The **PDF Preview** node displays PDF documents with download capability. It supports URLs, blob URLs, and base64-encoded PDFs up to 20MB, making it ideal for viewing PDF reports, documents, and files within workflows.\r
\r
## Category\r
\r
**Widget**\r
\r
## Parameters\r
\r
### pdfSource\r
\r
- **Type**: String (textarea)\r
- **Required**: Yes\r
- **Description**: PDF source\r
- **Supported Formats**:\r
  - URL (http:// or https://)\r
  - Blob URL (blob://)\r
  - Base64 data (data:application/pdf;base64,...)\r
- **Features**: Supports drag & drop of .pdf files\r
- **Size Limit**: Up to 20MB\r
\r
## Outputs\r
\r
### success\r
\r
- **Type**: Boolean\r
- **Description**: Whether the PDF was successfully processed\r
\r
### pdfUrl\r
\r
- **Type**: String\r
- **Description**: The PDF URL ready for rendering\r
\r
### metadata\r
\r
- **Type**: Object\r
- **Description**: PDF metadata including:\r
  - Source type (url, blob, base64)\r
  - File size in bytes\r
  - Page count (when available)\r
\r
### error\r
\r
- **Type**: String\r
- **Description**: Error message if PDF processing failed\r
\r
## Use Cases\r
\r
1. **Report Viewing**: Display generated PDF reports\r
2. **Document Preview**: Preview PDF documents before processing\r
3. **Invoice Display**: Show PDF invoices from APIs\r
4. **Contract Review**: Display PDF contracts for review\r
5. **Receipt Generation**: Preview generated receipts\r
6. **Documentation**: Display PDF documentation files\r
\r
## Example Configurations\r
\r
**Display PDF from URL**\r
\r
\`\`\`\r
pdfSource: https://example.com/document.pdf\r
\`\`\`\r
\r
**Display Base64 PDF**\r
\r
\`\`\`\r
pdfSource: data:application/pdf;base64,JVBERi0xLjQKJeLjz9MKMSAwIG9iago8PC...\r
\`\`\`\r
\r
**Display Generated PDF**\r
\r
\`\`\`\r
pdfSource: {{pdfGenerator.pdfUrl}}\r
\`\`\`\r
\r
## Tips\r
\r
- Maximum file size is 20MB for performance\r
- Base64 PDFs are automatically converted to blob URLs for rendering\r
- Supports download functionality for all PDF sources\r
- Metadata includes page count when available\r
- Works with both local and remote PDF sources\r
- Drag & drop support for easy file upload\r
\r
## Common Patterns\r
\r
**Report Generation Workflow**\r
\r
\`\`\`\r
1. Generate data with API calls\r
2. Create PDF report with external service\r
3. Display with PDF Preview\r
4. Allow user to download\r
\`\`\`\r
\r
**Invoice Processing**\r
\r
\`\`\`\r
1. Fetch invoice PDF from API\r
2. Display with PDF Preview\r
3. Extract data if needed\r
4. Store or email the invoice\r
\`\`\`\r
\r
**Document Approval Flow**\r
\r
\`\`\`\r
1. Upload PDF document\r
2. Display with PDF Preview for review\r
3. Use conditional logic for approval\r
4. Process based on decision\r
\`\`\`\r
\r
## Related Nodes\r
\r
- **Custom API Request**: For fetching PDFs from APIs\r
- **File System Operation**: For reading local PDF files\r
- **Send Email**: For emailing PDFs\r
- **Media Preview**: For displaying images\r
- **HTML Preview**: For displaying HTML content\r
\r
## Tags\r
\r
pdf, preview, document, display, widget, file, report, invoice\r
`;export{r as default};
