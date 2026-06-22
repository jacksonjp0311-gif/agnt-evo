// chemiframe-simulate.js — v3.0.0
// Simulates a compiled route through the CHEMIFRAME chemistry simulator.
// Three-tier: RDKit → IBM RXN API → Rule-based fallback.

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const CHEMIFRAME_PYTHON = path.resolve(path.dirname(__filename), 'chemiframe_py');

class ChemiframeSimulate {
  constructor() { this.name = 'chemiframe-simulate'; }

  async execute(params) {
    try {
      const { intent } = params;
      if (!intent) return { success: false, error: 'Missing required parameter: intent' };

      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chemiframe-'));
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
route = plan(intent)
contracts = run_preflight(route)

if not contracts.get('ok'):
    print(json.dumps({'success': False, 'error': 'Route failed verification', 'contracts': contracts}))
else:
    xdl = lower_to_xdl(route)
    sim = ChemistrySimulator()
    run = sim.execute(xdl)
    print(json.dumps({
        'success': True,
        'run_id': run.get('run_id'),
        'status': run.get('status'),
        'dec_events': run.get('dec_events', []),
        'simulation': run.get('simulation', {}),
        'route': route,
    }))
`;

      const result = await this._runPython(script, tmpDir);
      try { fs.rmSync(tmpDir, { recursive: true }); } catch (e) { /* ok */ }
      if (!result.success) return { success: false, error: result.error || 'Simulation failed' };
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

export default new ChemiframeSimulate();
