// chemiframe-cost-optimize.js — Evolution #4: Cost-Aware Route Optimization
// Scores routes by reagent cost, solvent cost, purification steps, and equipment needs.

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const CHEMIFRAME_PYTHON = path.resolve(path.dirname(__filename), 'chemiframe_py');

// Reagent cost database (approximate USD per gram, 2024 pricing)
const REAGENT_COSTS = {
  'aryl_halide': 15.0, 'boronic_acid': 25.0, 'grignard_reagent': 20.0,
  'aldehyde': 8.0, 'ketone': 10.0, 'amine': 12.0, 'azide': 45.0,
  'alkyne': 30.0, 'diene': 18.0, 'dienophile': 22.0,
  'aromatic': 5.0, 'acyl_halide': 15.0, 'alcl3': 3.0,
  'carbonyl': 8.0, 'nabh3cn': 35.0, 'fluoronitrobenzene': 40.0,
  'nucleophile': 20.0, 'enzyme': 150.0, 'substrate': 50.0,
  'phosphoramidite_A': 200.0, 'phosphoramidite_T': 200.0,
  'phosphoramidite_G': 220.0, 'phosphoramidite_C': 210.0,
  'chemical_segment': 50.0, 'bio_segment': 100.0,
  'protecting_group': 25.0, 'deprotection_reagent': 15.0,
  'crude_product': 0.0,
};

const SOLVENT_COSTS = {
  'water': 0.01, 'ethanol': 0.05, 'methanol': 0.04, 'acetonitrile': 0.08,
  'dcm': 0.06, 'ethyl_acetate': 0.05, 'hexane': 0.03, 'toluene': 0.04,
  'thf': 0.07, 'dmf': 0.09, 'dioxane': 0.08, 'dmso': 0.10,
};

class ChemiframeCostOptimize {
  constructor() { this.name = 'chemiframe-cost-optimize'; }

  async execute(params) {
    try {
      const { intent, optimize } = params;
      if (!intent) return { success: false, error: 'Missing required parameter: intent' };

      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chemiframe-cost-'));
      const intentFile = path.join(tmpDir, 'intent.yaml');
      fs.writeFileSync(intentFile, intent, 'utf-8');

      const script = `
import sys, json
sys.path.insert(0, '${CHEMIFRAME_PYTHON.replace(/\\/g, '/')}')
from chemiframe.intent.parser import load_intent
from chemiframe.planner import plan
from chemiframe.verify.contracts import run_preflight
from chemiframe.compiler.lower_to_xdl import lower_to_xdl

intent = load_intent('${intentFile.replace(/\\/g, '/')}')

# Generate the primary route
route = plan(intent)
contracts = run_preflight(route)
xdl = lower_to_xdl(route) if contracts.get('ok') else None

# Calculate cost estimate
reagent_cost = 0.0
for inp in intent.get('inputs', []):
    reagent_cost += ${JSON.stringify(REAGENT_COSTS)}.get(inp, 25.0)

# Estimate solvent cost based on step count
n_steps = len(route.get('steps', []))
solvent_cost = n_steps * 2.0  # ~$2 per step for solvents

# Purification cost
purification_steps = sum(1 for s in route.get('steps', []) if 'purif' in s.get('label', '') or 'workup' in s.get('label', ''))
purification_cost = purification_steps * 15.0

# Equipment cost (time-based)
equipment_cost = n_steps * 5.0  # ~$5 per step for equipment time

total_cost = reagent_cost + solvent_cost + purification_cost + equipment_cost

# Green chemistry bonus
green_bonus = intent.get('constraints', {}).get('green_solvents_only', False)
if green_bonus:
    solvent_cost *= 0.7  # Green solvents are cheaper to dispose of
    total_cost = reagent_cost + solvent_cost + purification_cost + equipment_cost

print(json.dumps({
    'success': True,
    'route': route,
    'contracts': contracts,
    'xdl': xdl,
    'cost_breakdown': {
        'reagent_cost': round(reagent_cost, 2),
        'solvent_cost': round(solvent_cost, 2),
        'purification_cost': round(purification_cost, 2),
        'equipment_cost': round(equipment_cost, 2),
        'total_estimated_cost': round(total_cost, 2),
        'currency': 'USD',
        'green_discount_applied': green_bonus,
    },
    'step_count': n_steps,
    'purification_steps': purification_steps,
    'cost_per_step': round(total_cost / max(n_steps, 1), 2),
}))
`;

      const result = await this._runPython(script, tmpDir);
      try { fs.rmSync(tmpDir, { recursive: true }); } catch (e) { /* ok */ }
      if (!result.success) return { success: false, error: result.error };
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  _runPython(script, cwd) {
    return new Promise((resolve) => {
      const proc = spawn('python', ['-c', script], { cwd, env: { ...process.env, PYTHONIOENCODING: 'utf-8' }, timeout: 30000 });
      let stdout = '', stderr = '';
      proc.stdout.on('data', d => { stdout += d; });
      proc.stderr.on('data', d => { stderr += d; });
      proc.on('close', code => {
        if (code !== 0) return resolve({ success: false, error: stderr || `Exit code ${code}` });
        try { resolve(JSON.parse(stdout.trim().split('\n').pop())); }
        catch (e) { resolve({ success: false, error: `Parse error: ${e.message}` }); }
      });
      proc.on('error', err => resolve({ success: false, error: `Spawn error: ${err.message}` }));
    });
  }
}

export default new ChemiframeCostOptimize();
