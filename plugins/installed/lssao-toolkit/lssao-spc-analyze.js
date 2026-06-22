class Tool {
  constructor(){ this.name='lssao-spc-analyze'; }
  async execute(params, inputData, workflowEngine){
    try {


function mean(xs){ return xs.reduce((a,b)=>a+b,0)/xs.length; }
function std(xs){
  const m = mean(xs);
  const v = xs.reduce((a,x)=>a+(x-m)*(x-m),0)/(xs.length-1 || 1);
  return Math.sqrt(v);
}
function erf(x){
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);
  const a1=0.254829592,a2=-0.284496736,a3=1.421413741,a4=-1.453152027,a5=1.061405429,p=0.3275911;
  const t = 1/(1+p*x);
  const y = 1-((((a5*t+a4)*t+a3)*t+a2)*t+a1)*t*Math.exp(-x*x);
  return sign*y;
}
function normCdf(x){ return 0.5*(1+erf(x/Math.SQRT2)); }
function normInv(p){
  if(p<=0||p>=1) throw new Error('p must be in (0,1)');
  const a=[-39.6968302866538,220.946098424521,-275.928510446969,138.357751867269,-30.6647980661472,2.50662827745924];
  const b=[-54.4760987982241,161.585836858041,-155.698979859887,66.8013118877197,-13.2806815528857];
  const c=[-0.00778489400243029,-0.322396458041136,-2.40075827716184,-2.54973253934373,4.37466414146497,2.93816398269878];
  const d=[0.00778469570904146,0.32246712907004,2.445134137143,3.75440866190742];
  const plow=0.02425, phigh=1-plow;
  let q,r;
  if(p<plow){
    q=Math.sqrt(-2*Math.log(p));
    return (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])/
           ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
  }
  if(p>phigh){
    q=Math.sqrt(-2*Math.log(1-p));
    return -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])/
            ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
  }
  q=p-0.5;
  r=q*q;
  return (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q/
         (((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1);
}

let series;
try{ series = JSON.parse(params.seriesJson || '[]'); } catch { throw new Error('seriesJson must be valid JSON array of numbers'); }
if(!Array.isArray(series) || series.length<5) throw new Error('seriesJson must be an array with at least 5 numbers');
const xs = series.map(Number).filter(Number.isFinite);
if(xs.length<5) throw new Error('seriesJson must contain at least 5 finite numbers');
const m = mean(xs);
const s = std(xs);
const k = params.sigmaMultiplier ? Number(params.sigmaMultiplier) : 3;
const ucl = m + k*s;
const lcl = m - k*s;
const signals = [];
xs.forEach((x,i)=>{ if(x>ucl || x<lcl) signals.push({rule:'beyond_limits', index:i, value:x}); });
let runSide = 0;
let runLen = 0;
for(let i=0;i<xs.length;i++){
  const side = xs[i] >= m ? 1 : -1;
  if(side===runSide) runLen++; else { runSide=side; runLen=1; }
  if(runLen===7) signals.push({rule:'7_on_one_side', endIndex:i, side: runSide===1?'above':'below'});
}
let trend = 0;
let tlen = 0;
for(let i=1;i<xs.length;i++){
  const dir = xs[i] > xs[i-1] ? 1 : (xs[i] < xs[i-1] ? -1 : 0);
  if(dir===0){ trend=0; tlen=0; continue; }
  if(dir===trend) tlen++; else { trend=dir; tlen=1; }
  if(tlen===6) signals.push({rule:'6_trend', endIndex:i, direction: trend===1?'up':'down'});
}
return { success:true, result: { n: xs.length, mean: m, stdev: s, ucl, lcl, sigmaMultiplier: k, signals } };

    } catch (error) {
      console.error('['+this.name+'] Error:', error);
      return { success:false, error: String(error?.message||error) };
    }
  }
}

export default new Tool();
