class Tool {
  constructor(){ this.name='lssao-flow-analyze'; }
  async execute(params, inputData, workflowEngine){
    try {

let stages;
try{ stages = JSON.parse(params.stagesJson || '[]'); } catch { throw new Error('stagesJson must be valid JSON array'); }
if(!Array.isArray(stages) || stages.length<1) throw new Error('stagesJson must be a non-empty array');
const parsed = stages.map(s => ({
  name: String(s.name||''),
  arrivalRate: Number(s.arrivalRate ?? NaN),
  serviceRate: Number(s.serviceRate ?? NaN),
  wip: Number(s.wip ?? NaN),
  avgTime: Number(s.avgTime ?? NaN)
}));
const enriched = parsed.map(s => {
  const rho = (Number.isFinite(s.arrivalRate) && Number.isFinite(s.serviceRate) && s.serviceRate>0) ? (s.arrivalRate/s.serviceRate) : null;
  const littleWip = (Number.isFinite(s.arrivalRate) && Number.isFinite(s.avgTime)) ? (s.arrivalRate*s.avgTime) : null;
  return { ...s, utilization: rho, littleWip };
});
let bottleneck = null;
for(const s of enriched){
  if(s.utilization===null) continue;
  if(!bottleneck || s.utilization > bottleneck.utilization) bottleneck = s;
}
const recommendations = [];
if(bottleneck){
  recommendations.push("Bottleneck appears to be '" + bottleneck.name + "' with utilization " + bottleneck.utilization.toFixed(2) + ". Improve this stage first (capacity, parallelism, batching, caching)." );
}
return { success:true, result: { stages: enriched, bottleneck, recommendations } };

    } catch (error) {
      console.error('['+this.name+'] Error:', error);
      return { success:false, error: String(error?.message||error) };
    }
  }
}

export default new Tool();
