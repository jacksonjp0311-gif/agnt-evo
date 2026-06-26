
import tool from 'file:///C:/Users/jacks/AppData/Roaming/AGNT/plugins/installed/improve/tools/improve-audit.js';
const r = await tool.execute({ repo_path: 'C:\\Users\\jacks\\OneDrive\\Desktop\\agnt-evo\\backend', mode: 'full', focus_paths: '' });
console.log('AUDIT_JSON_START');
console.log(JSON.stringify(r.summary, null, 2));
console.log('AUDIT_JSON_END');
console.log('FINDINGS_COUNT:' + r.findings.length);
