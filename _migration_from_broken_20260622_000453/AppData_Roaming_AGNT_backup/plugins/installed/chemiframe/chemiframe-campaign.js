// chemiframe-campaign.js — Evolution #6: Multi-Step Campaign Planner
// Plans an entire synthetic campaign: retrosynthetic tree, intermediate
// identification, parallel vs sequential scheduling, and equipment sharing.

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const CHEMIFRAME_PYTHON = path.resolve(path.dirname(__filename), 'chemiframe_py');

class ChemiframeCampaign {
  constructor() { this.name = 'chemiframe-campaign'; }

  async execute(params) {
    try {
      const { intent, max_depth } = params;
      if (!intent) return { success: false, error: 'Missing required parameter: intent' };

      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chemiframe-campaign-'));
      const intentFile = path.join(tmpDir, 'intent.yaml');
      fs.writeFileSync(intentFile, intent, 'utf-8');

      const script = `
import sys, json
sys.path.insert(0, '${CHEMIFRAME_PYTHON.replace(/\\/g, '/')}')
from chemiframe.intent.parser import load_intent
from chemiframe.planner import plan
from chemiframe.verify.contracts import run_preflight
from chemiframe.compiler.lower_to_xdl import lower_to_xdl
from chemiframe.adapters.chemistry_simulator import ChemistrySimulator

intent = load_intent('${intentFile.replace(/\\/g, '/')}')

# Generate primary route
route = plan(intent)
contracts = run_preflight(route)
xdl = lower_to_xdl(route) if contracts.get('ok') else None

# Build campaign plan
sim = ChemistrySimulator()
campaign_depth = ${max_depth || 3}

# Analyze the route for campaign planning
steps = route.get('steps', [])
n_steps = len(steps)

# Identify parallelizable steps (independent operations)
parallel_groups = []
current_group = []
for i, step in enumerate(steps):
    label = step.get('label', '')
    op = step.get('op', '')
    # Steps that can run in parallel: independent material additions
    if op == 'AM' and i > 0:
        current_group.append(step)
    else:
        if current_group:
            parallel_groups.append(current_group)
            current_group = []
        parallel_groups.append([step])
if current_group:
    parallel_groups.append(current_group)

# Equipment requirements
equipment = set()
for step in steps:
    label = step.get('label', '')
    if 'reactor' in label or 'charge' in label:
        equipment.add('reactor')
    if 'heat' in label or 'stir' in label:
        equipment.add('heating_stirrer')
    if 'monitor' in label or 'checkpoint' in label:
        equipment.add('analytical_instrument')
    if 'purif' in label:
        equipment.add('chromatography')
    if 'extract' in label:
        equipment.add('separatory_funnel')
    if 'incubate' in label:
        equipment.add('incubator')

# Time estimate (minutes)
time_per_step = {
    'AM': 15, 'SM': 20, 'AE': 60, 'SE': 30,
}
total_time = sum(time_per_step.get(s.get('op', ''), 30) for s in steps)
parallel_time = sum(
    max(time_per_step.get(s.get('op', ''), 30) for s in group)
    for group in parallel_groups
)

# Intermediates
intermediates = []
for i, step in enumerate(steps):
    if step.get('op') == 'AE' and i < len(steps) - 1:
        intermediates.append({
            'after_step': i + 1,
            'name': f'intermediate_{i+1}',
            'step_label': step.get('label', ''),
        })

print(json.dumps({
    'success': True,
    'campaign': {
        'name': f"Campaign: {intent.get('target_family', 'synthesis')}",
        'total_steps': n_steps,
        'parallel_groups': len(parallel_groups),
        'estimated_time_sequential_min': total_time,
        'estimated_time_parallel_min': parallel_time,
        'time_savings_min': total_time - parallel_time,
        'time_savings_pct': round((1 - parallel_time / max(total_time, 1)) * 100, 1),
        'equipment_needed': sorted(equipment),
        'intermediates': intermediates,
        'depth': campaign_depth,
    },
    'route': route,
    'contracts': contracts,
    'xdl': xdl,
    'step_sequence': [
        {
            'step_num': i + 1,
            'op': s.get('op', ''),
            'label': s.get('label', ''),
            'estimated_min': time_per_step.get(s.get('op', ''), 30),
            'group': next((gi + 1, gi, g) for gi, g in enumerate(parallel_groups) if s in g)[0],
        }
        for i, s in enumerate(steps)
    ],
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

export default new ChemiframeCampaign();
