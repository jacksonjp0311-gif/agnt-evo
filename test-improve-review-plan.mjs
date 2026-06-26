
import tool from 'file:///C:/Users/jacks/AppData/Roaming/AGNT/plugins/installed/improve/tools/improve-review-plan.js';
const r = await tool.execute({ plan_path: 'C:\\Users\\jacks\\OneDrive\\Desktop\\agnt-evo\\backend\\plans\\001-console-statements-in-production-code-backendpluginsbuild-pluginjs.md' });
console.log('REVIEW:' + JSON.stringify({success: r.success, score: r.score, verdict: r.verdict, failed: r.failed_checks?.length, passed: r.passed_checks?.length}));
