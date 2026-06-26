
import tool from 'file:///C:/Users/jacks/AppData/Roaming/AGNT/plugins/installed/improve/tools/improve-review-plan.js';
const result = await tool.execute({
  plan_path: 'C:\\Users\\jacks\\OneDrive\\Desktop\\agnt-evo\\backend\\plans\\001-console-statements-in-production-code-backendpluginsbuild-pluginjs.md'
});
console.log('REVIEW_RESULT:' + JSON.stringify(result, null, 2));
