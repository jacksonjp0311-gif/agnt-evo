class Tool {
  constructor(){ this.name='lssao-doe-plan'; }
  async execute(params, inputData, workflowEngine){
    try {

let factors;
try{ factors = JSON.parse(params.factorsJson || '[]'); } catch { throw new Error('factorsJson must be valid JSON array'); }
if(!Array.isArray(factors) || factors.length<1) throw new Error('factorsJson must be a non-empty array');
const k = factors.length;
const runsLimit = params.runsLimit ? Number(params.runsLimit) : 64;
if(!Number.isFinite(runsLimit) || runsLimit<2) throw new Error('runsLimit must be >= 2');

function* fullFactorial(k){
  const total = 1<<k;
  for(let mask=0; mask<total; mask++){
    const row=[];
    for(let i=0;i<k;i++) row.push(((mask>>i)&1) ? 1 : -1);
    yield row;
  }
}

function mulberry32(a){
  return function(){
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
}

const design = String(params.design || (k<=6 ? 'FULL_FACTORIAL' : 'FRACTIONAL_RANDOM'));
let coded=[];
if(design==='FULL_FACTORIAL' && k<=12){
  for(const row of fullFactorial(k)) coded.push(row);
} else {
  const total = Math.min(runsLimit, Math.max(8, Math.min(256, 1<<Math.min(k,12))));
  const rng = mulberry32(Number(params.seed)||123456);
  const seen = new Set();
  while(coded.length<total){
    const row=[];
    for(let i=0;i<k;i++) row.push(rng() < 0.5 ? -1 : 1);
    const key=row.join(',');
    if(!seen.has(key)) { seen.add(key); coded.push(row); }
  }
}

const runs = coded.slice(0, runsLimit).map((row, idx) => {
  const assignment = {};
  for(let i=0;i<k;i++){
    const f = factors[i];
    assignment[String(f.name)] = (row[i]===-1) ? f.low : f.high;
  }
  return { run: idx+1, coded: row, assignment };
});

return { success:true, result: { design, k, runsCount: runs.length, factors, runs } };

    } catch (error) {
      console.error('['+this.name+'] Error:', error);
      return { success:false, error: String(error?.message||error) };
    }
  }
}

export default new Tool();
