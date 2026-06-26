
import tool from 'file:///C:/Users/jacks/AppData/Roaming/AGNT/plugins/installed/improve/tools/improve-plan.js';
const r = await tool.execute({ finding: 'Test finding for validation', repo_path: 'C:\\Users\\jacks\\OneDrive\\Desktop\\agnt-evo\\backend', plan_number: 2, output_dir: 'C:\\Users\\jacks\\OneDrive\\Desktop\\agnt-evo\\backend\\plans' });
console.log('PLAN:' + JSON.stringify({success: r.success, plan_file: r.plan_file}));
