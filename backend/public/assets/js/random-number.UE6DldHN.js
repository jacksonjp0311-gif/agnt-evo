const n=`# Random Number\r
\r
## Overview\r
\r
The **Random Number** node generates a random number within a specified range. This utility is useful for creating randomized workflows, testing scenarios, or adding variability to your automation processes.\r
\r
## Category\r
\r
**Utility**\r
\r
## Parameters\r
\r
### min\r
\r
- **Type**: String (numeric)\r
- **Required**: Yes\r
- **Description**: The minimum value (inclusive) for the random number generation\r
- **Example**: \`1\`, \`0\`, \`-10\`\r
\r
### max\r
\r
- **Type**: String (numeric)\r
- **Required**: Yes\r
- **Description**: The maximum value (inclusive) for the random number generation\r
- **Example**: \`100\`, \`1000\`, \`50\`\r
\r
## Outputs\r
\r
### randomNumber\r
\r
- **Type**: Number\r
- **Description**: The generated random number within the specified range (inclusive of both min and max)\r
\r
## Use Cases\r
\r
1. **A/B Testing**: Randomly assign users to different test groups\r
2. **Game Mechanics**: Generate random values for game elements\r
3. **Load Testing**: Create random delays or data for testing\r
4. **Sampling**: Select random items from a dataset\r
5. **Lottery Systems**: Generate random numbers for selection processes\r
\r
## Example Configuration\r
\r
**Basic Random Number (1-100)**\r
\r
\`\`\`\r
min: 1\r
max: 100\r
\`\`\`\r
\r
**Random Percentage (0-100)**\r
\r
\`\`\`\r
min: 0\r
max: 100\r
\`\`\`\r
\r
**Random Delay (1-10 seconds)**\r
\r
\`\`\`\r
min: 1\r
max: 10\r
\`\`\`\r
\r
## Tips\r
\r
- The generated number is **inclusive** of both min and max values\r
- Both min and max can be negative numbers\r
- The node generates integers, not decimal numbers\r
- Use the output in conditional logic or as input to other nodes\r
- Combine with a For Loop to generate multiple random numbers\r
\r
## Common Patterns\r
\r
**Random Selection**\r
\r
\`\`\`\r
1. Generate random number between 1 and N (where N is your list size)\r
2. Use the number to select an item from a list\r
\`\`\`\r
\r
**Random Delay**\r
\r
\`\`\`\r
1. Generate random number for seconds\r
2. Pass to Delay node for variable timing\r
\`\`\`\r
\r
**Probability-Based Logic**\r
\r
\`\`\`\r
1. Generate random number 1-100\r
2. Use conditional edges to create probability-based paths\r
   - If randomNumber <= 30: Path A (30% chance)\r
   - If randomNumber > 30: Path B (70% chance)\r
\`\`\`\r
\r
## Related Nodes\r
\r
- **Counter**: For sequential number generation\r
- **Delay**: Often used with random numbers for variable delays\r
- **For Loop**: Generate multiple random numbers\r
- **Data Transformer**: Transform the random number output\r
\r
## Tags\r
\r
random, number, generator, utility, probability, testing\r
`;export{n as default};
