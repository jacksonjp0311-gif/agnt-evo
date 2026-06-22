const r=`# Database Operation 🗄️\r
\r
## Id\r
\r
\`database-operation\`\r
\r
## Description\r
\r
This utility node performs database operations on user-specific data. It supports SELECT, INSERT, UPDATE, and DELETE operations on virtual tables.\r
\r
## Tags\r
\r
database, utility, data, storage, CRUD\r
\r
## Input Parameters\r
\r
### Required\r
\r
- **operation** (string): The type of database operation to perform (\`SELECT\`, \`INSERT\`, \`UPDATE\`, \`DELETE\`)\r
- **tableName** (string): The name of the virtual table to operate on\r
\r
### Optional\r
\r
- **columns** (string) [SELECT, INSERT, UPDATE operations only]: Comma-separated list of columns\r
- **condition** (string) [SELECT, UPDATE, DELETE operations only]: WHERE clause for the operation\r
- **values** (string) [INSERT, UPDATE, DELETE operations only]: Comma-separated list of values\r
\r
## Output Format\r
\r
- **success** (boolean): Indicates whether the database operation was successful\r
- **result** (array) [SELECT operations only]: The data returned by the database operation\r
- **affectedRows** (number) [INSERT, UPDATE, DELETE operations only]: The number of rows affected by the operation\r
- **error** (string): Error message if the database operation failed\r
`;export{r as default};
