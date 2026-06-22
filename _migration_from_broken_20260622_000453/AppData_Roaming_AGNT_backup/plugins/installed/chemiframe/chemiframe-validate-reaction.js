// chemiframe-validate-reaction.js — Evolution #3: Reaction Validation via PubChem API
// Checks if a predicted reaction has precedent in the literature before simulation.

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const CHEMIFRAME_PYTHON = path.resolve(path.dirname(__filename), 'chemiframe_py');

class ChemiframeValidateReaction {
  constructor() { this.name = 'chemiframe-validate-reaction'; }

  async execute(params) {
    try {
      const { intent } = params;
      if (!intent) return { success: false, error: 'Missing required parameter: intent' };

      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chemiframe-val-'));
      const intentFile = path.join(tmpDir, 'intent.yaml');
      fs.writeFileSync(intentFile, intent, 'utf-8');

      const script = `
import sys, json
sys.path.insert(0, '${CHEMIFRAME_PYTHON.replace(/\\/g, '/')}')
from chemiframe.intent.parser import load_intent
from chemiframe.planner import plan
from chemiframe.adapters.chemistry_simulator import ChemistrySimulator

intent = load_intent('${intentFile.replace(/\\/g, '/')}')
route = plan(intent)

# Use the simulator to validate the reaction against known chemistry
sim = ChemistrySimulator()
validation = sim.validate_reaction(route)

print(json.dumps({
    'route': route,
    'validation': validation,
    'literature_precedent': validation.get('precedent', 'unknown'),
    'known_reaction': validation.get('known', False),
    'similar_reactions': validation.get('similar_count', 0),
    'confidence_adjustment': validation.get('confidence_adj', 0),
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

export default new ChemiframeValidateReaction();
