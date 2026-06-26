
import tool from 'file:///C:/Users/jacks/AppData/Roaming/AGNT/plugins/installed/improve/tools/improve-reconcile.js';
const r = await tool.execute({ repo_path: 'C:\\Users\\jacks\\OneDrive\\Desktop\\agnt-evo\\backend', plans_dir: '' });
console.log('RECONCILE:' + JSON.stringify({success: r.success, plans_found: r.plans_found, actions: r.actions?.length}));
