class Tool {
  constructor(){ this.name='lssao-evidence-gate'; }
  async execute(params, inputData, workflowEngine){
    try {

let baseline, candidate, thresholds;
try{ baseline = JSON.parse(params.baselineJson || '{}'); } catch { throw new Error('baselineJson must be valid JSON object'); }
try{ candidate = JSON.parse(params.candidateJson || '{}'); } catch { throw new Error('candidateJson must be valid JSON object'); }
try{ thresholds = JSON.parse(params.thresholdsJson || '{}'); } catch { thresholds = {}; }

const failed = [];
const notes = [];
const get = (obj, key) => obj && Object.prototype.hasOwnProperty.call(obj,key) ? obj[key] : undefined;

if(get(candidate,'measurementValid') === false) failed.push('measurement');
const safetyRegressions = get(candidate,'safetyRegressions');
if(Array.isArray(safetyRegressions) && safetyRegressions.length>0) failed.push('safety');

const specialCauseSignals = Number(get(candidate,'specialCauseSignals') ?? 0);
const maxSignals = Number(get(thresholds,'maxSpecialCauseSignals') ?? 0);
if(specialCauseSignals > maxSignals) failed.push('stability');

const primary = String(get(thresholds,'primaryMetric') ?? '');
const deltaMin = Number(get(thresholds,'deltaMin') ?? 0);
if(primary){
  const b = Number(get(baseline, primary));
  const c = Number(get(candidate, primary));
  if(Number.isFinite(b) && Number.isFinite(c)){
    const delta = c - b;
    notes.push({ primary, baseline: b, candidate: c, delta, deltaMin });
    if(delta < deltaMin) failed.push('effect');
  } else {
    failed.push('effect');
    notes.push({primary, error:'missing or non-numeric baseline/candidate for primaryMetric'});
  }
}

const flowMetric = String(get(thresholds,'flowMetric') ?? '');
const flowMax = Number(get(thresholds,'flowMax') ?? NaN);
if(flowMetric && Number.isFinite(flowMax)){
  const c = Number(get(candidate, flowMetric));
  if(!Number.isFinite(c) || c > flowMax) failed.push('flow');
}

const robustPass = get(candidate,'robustnessPass');
if(robustPass === false) failed.push('robustness');

if(get(candidate,'rollbackReady') === false) failed.push('rollback');

const unsupportedClaimRate = Number(get(candidate,'unsupportedClaimRate') ?? NaN);
const ucrMax = Number(get(thresholds,'unsupportedClaimRateMax') ?? NaN);
if(Number.isFinite(unsupportedClaimRate) && Number.isFinite(ucrMax) && unsupportedClaimRate > ucrMax) failed.push('evidence');

const pass = failed.length===0;
return { success:true, result: { pass, failedGates: [...new Set(failed)], notes } };

    } catch (error) {
      console.error('['+this.name+'] Error:', error);
      return { success:false, error: String(error?.message||error) };
    }
  }
}

export default new Tool();
