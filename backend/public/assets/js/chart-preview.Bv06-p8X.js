const r=`# Chart Preview\r
\r
## Overview\r
\r
The **Chart Preview** node provides data visualization with multiple chart types including bar, line, pie, doughnut, and radar charts. It supports both JSON and CSV data formats, making it perfect for displaying data insights and analytics in workflows.\r
\r
## Category\r
\r
**Widget**\r
\r
## Parameters\r
\r
### chartData\r
\r
- **Type**: String (textarea)\r
- **Required**: Yes\r
- **Description**: Chart data in JSON or CSV format\r
- **JSON Format**:\r
  \`\`\`json\r
  {\r
    "labels": ["Label1", "Label2", "Label3"],\r
    "datasets": [\r
      {\r
        "label": "Dataset Name",\r
        "data": [10, 20, 30]\r
      }\r
    ]\r
  }\r
  \`\`\`\r
- **CSV Format**: First row as headers, subsequent rows as data\r
- **Features**: Supports drag & drop of .json and .csv files\r
\r
### chartType\r
\r
- **Type**: String (select)\r
- **Required**: No\r
- **Default**: bar\r
- **Options**:\r
  - **bar**: Vertical bar chart\r
  - **line**: Line chart with points\r
  - **pie**: Circular pie chart\r
  - **doughnut**: Doughnut chart (pie with center hole)\r
  - **radar**: Radar/spider chart\r
- **Description**: Type of chart to display\r
\r
## Outputs\r
\r
### success\r
\r
- **Type**: Boolean\r
- **Description**: Whether the chart data was successfully processed\r
\r
### chartData\r
\r
- **Type**: Object\r
- **Description**: The parsed and formatted chart data\r
\r
### chartType\r
\r
- **Type**: String\r
- **Description**: The chart type being displayed\r
\r
### metadata\r
\r
- **Type**: Object\r
- **Description**: Chart metadata including:\r
  - Data point count\r
  - Dataset count\r
  - Value range (min/max)\r
  - Total sum\r
  - Average value\r
\r
### error\r
\r
- **Type**: String\r
- **Description**: Error message if chart processing failed\r
\r
## Use Cases\r
\r
1. **Analytics Dashboard**: Display business metrics and KPIs\r
2. **Sales Reports**: Visualize sales data over time\r
3. **Survey Results**: Show survey response distributions\r
4. **Performance Metrics**: Display system or application performance\r
5. **Financial Data**: Visualize financial trends and comparisons\r
6. **Data Comparison**: Compare multiple datasets visually\r
\r
## Example Configurations\r
\r
**Bar Chart (JSON)**\r
\r
\`\`\`\r
chartData: {\r
  "labels": ["Jan", "Feb", "Mar", "Apr"],\r
  "datasets": [{\r
    "label": "Sales",\r
    "data": [1200, 1900, 1500, 2100]\r
  }]\r
}\r
chartType: bar\r
\`\`\`\r
\r
**Line Chart (CSV)**\r
\r
\`\`\`\r
chartData: Month,Revenue\r
January,50000\r
February,65000\r
March,58000\r
April,72000\r
chartType: line\r
\`\`\`\r
\r
**Pie Chart**\r
\r
\`\`\`\r
chartData: {\r
  "labels": ["Product A", "Product B", "Product C"],\r
  "datasets": [{\r
    "label": "Market Share",\r
    "data": [45, 30, 25]\r
  }]\r
}\r
chartType: pie\r
\`\`\`\r
\r
## Chart Types Explained\r
\r
### Bar Chart\r
\r
- Best for comparing values across categories\r
- Vertical bars show magnitude\r
- Good for time series or categorical data\r
\r
### Line Chart\r
\r
- Best for showing trends over time\r
- Connects data points with lines\r
- Ideal for continuous data\r
\r
### Pie Chart\r
\r
- Best for showing proportions of a whole\r
- Each slice represents a percentage\r
- Limited to single dataset\r
\r
### Doughnut Chart\r
\r
- Similar to pie chart with center hole\r
- More modern appearance\r
- Better for displaying percentages\r
\r
### Radar Chart\r
\r
- Best for comparing multiple variables\r
- Shows data on multiple axes\r
- Good for performance comparisons\r
\r
## Tips\r
\r
- JSON format provides more control over chart configuration\r
- CSV format is simpler for basic data\r
- Metadata includes statistical information about your data\r
- Drag & drop support for easy data import\r
- Multiple datasets can be displayed on bar and line charts\r
- Choose chart type based on your data story\r
\r
## Common Patterns\r
\r
**API Data Visualization**\r
\r
\`\`\`\r
1. Fetch data from API with Custom API Request\r
2. Transform data with Data Transformer\r
3. Pass to Chart Preview with appropriate type\r
4. Display insights visually\r
\`\`\`\r
\r
**Database Analytics**\r
\r
\`\`\`\r
1. Query database with Database Operation\r
2. Format results as JSON\r
3. Display with Chart Preview\r
4. Use metadata for additional insights\r
\`\`\`\r
\r
**Real-time Monitoring**\r
\r
\`\`\`\r
1. Collect metrics over time\r
2. Store in array format\r
3. Update Chart Preview periodically\r
4. Monitor trends visually\r
\`\`\`\r
\r
## Data Format Examples\r
\r
**Single Dataset (JSON)**\r
\r
\`\`\`json\r
{\r
  "labels": ["A", "B", "C"],\r
  "datasets": [\r
    {\r
      "label": "Values",\r
      "data": [10, 20, 15]\r
    }\r
  ]\r
}\r
\`\`\`\r
\r
**Multiple Datasets (JSON)**\r
\r
\`\`\`json\r
{\r
  "labels": ["Q1", "Q2", "Q3", "Q4"],\r
  "datasets": [\r
    {\r
      "label": "2023",\r
      "data": [100, 120, 115, 140]\r
    },\r
    {\r
      "label": "2024",\r
      "data": [110, 130, 125, 150]\r
    }\r
  ]\r
}\r
\`\`\`\r
\r
**CSV Format**\r
\r
\`\`\`\r
Category,Value\r
Item 1,25\r
Item 2,40\r
Item 3,35\r
\`\`\`\r
\r
## Related Nodes\r
\r
- **Custom API Request**: For fetching data from APIs\r
- **Database Operation**: For querying databases\r
- **Data Transformer**: For formatting data\r
- **Execute JavaScript**: For complex data transformations\r
- **Google Sheets API**: For fetching spreadsheet data\r
\r
## Tags\r
\r
chart, graph, visualization, data, analytics, widget, bar, line, pie, dashboard\r
`;export{r as default};
