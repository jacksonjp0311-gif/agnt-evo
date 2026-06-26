
import tool from 'file:///C:/Users/jacks/AppData/Roaming/AGNT/plugins/installed/improve/tools/improve-audit.js';
const r = await tool.execute({ repo_path: 'C:\\Users\\jacks\\OneDrive\\Desktop\\agnt-evo\\backend', mode: 'quick', focus_paths: '' });
console.log('AUDIT:' + JSON.stringify({success: r.success, totalFindings: r.summary?.totalFindings, bySeverity: r.summary?.bySeverity}));
