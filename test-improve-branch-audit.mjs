
import tool from 'file:///C:/Users/jacks/AppData/Roaming/AGNT/plugins/installed/improve/tools/improve-branch-audit.js';
const r = await tool.execute({ repo_path: 'C:\\Users\\jacks\\OneDrive\\Desktop\\agnt-evo\\backend', base_branch: 'main' });
console.log('BRANCH:' + JSON.stringify({success: r.success, summary: r.summary, warning: r.warning}));
