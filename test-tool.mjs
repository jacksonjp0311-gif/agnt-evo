
import tool from 'file:///C:/Users/jacks/AppData/Roaming/AGNT/plugins/installed/improve/tools/improve-audit.js';
const result = await tool.execute({
  repo_path: 'C:\\Users\\jacks\\OneDrive\\Desktop\\agnt-evo\\backend',
  mode: 'quick',
  focus_paths: ''
});
console.log('DIRECT_RESULT:' + JSON.stringify(result, null, 2));
