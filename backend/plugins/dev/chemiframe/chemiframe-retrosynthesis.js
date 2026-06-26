// chemiframe-retrosynthesis.js — v3.0.0
// Predict retrosynthetic pathways for a target molecule.

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const CHEMIFRAME_PYTHON = path.resolve(path.dirname(__filename), 'chemiframe_py');

class ChemiframeRetrosynthesis {
  constructor() { this.name = 'chemiframe-retrosynthesis'; }

  async execute(params) {
    try {
      const { target, target_smiles, max_steps } = params;
      if (!target && !target_smiles) return { success: false, error: 'Missing required parameter: target (name) or target_smiles' };

      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chemiframe-retro-'));
      const inputFile = path.join(tmpDir, 'retro_input.json');
      fs.writeFileSync(inputFile, JSON.stringify({ target: target || '', target_smiles: target_smiles || '', max_steps: max_steps || 5 }), 'utf-8');

      const script = `
import sys, json
sys.path.insert(0, '${CHEMIFRAME_PYTHON.replace(/\\/g, '/')}')
from chemiframe.adapters.chemistry_simulator import ChemistrySimulator

with open('${inputFile.replace(/\\/g, '/')}') as f:
    inp = json.load(f)

sim = ChemistrySimulator()

# Try SMILES-based prediction first, then name-based
if inp.get('target_smiles'):
    result = sim.predict_reaction([inp['target_smiles']], reaction_type='retrosynthesis')
else:
    result = sim.predict_reaction([inp['target']], reaction_type='retrosynthesis')

print(json.dumps(result))
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

export default new ChemiframeRetrosynthesis();
