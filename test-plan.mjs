
import tool from 'file:///C:/Users/jacks/AppData/Roaming/AGNT/plugins/installed/improve/tools/improve-plan.js';
const result = await tool.execute({
  finding: 'Console statements in production code — backend/plugins/build-plugin.js has console.log statements',
  repo_path: 'C:\\Users\\jacks\\OneDrive\\Desktop\\agnt-evo\\backend',
  plan_number: 1,
  output_dir: 'C:\\Users\\jacks\\OneDrive\\Desktop\\agnt-evo\\backend\\plans'
});
console.log('PLAN_RESULT:' + JSON.stringify(result, null, 2));
