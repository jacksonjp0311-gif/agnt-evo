// chemiframe-smiles-input.js — Evolution #2: SMILES-Native Intent Input
// Accepts a SMILES string for the target molecule, analyzes functional groups,
// suggests retrosynthetic disconnections, and generates a structured intent.

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const CHEMIFRAME_PYTHON = path.resolve(path.dirname(__filename), 'chemiframe_py');

class ChemiframeSmilesInput {
  constructor() { this.name = 'chemiframe-smiles-input'; }

  async execute(params) {
    try {
      const { target_smiles, auto_compile } = params;
      if (!target_smiles) return { success: false, error: 'Missing required parameter: target_smiles' };

      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chemiframe-smiles-'));
      const inputFile = path.join(tmpDir, 'smiles_input.json');
      fs.writeFileSync(inputFile, JSON.stringify({ target_smiles, auto_compile: !!auto_compile }), 'utf-8');

      const script = `
import sys, json
sys.path.insert(0, '${CHEMIFRAME_PYTHON.replace(/\\/g, '/')}')
from chemiframe.adapters.chemistry_simulator import ChemistrySimulator
from chemiframe.intent.parser import load_intent
from chemiframe.planner import plan
from chemiframe.verify.contracts import run_preflight
from chemiframe.compiler.lower_to_xdl import lower_to_xdl

with open('${inputFile.replace(/\\/g, '/')}') as f:
    inp = json.load(f)

smiles = inp['target_smiles']
sim = ChemistrySimulator()

# Analyze the molecule
analysis = sim.analyze_molecule(smiles)

# Generate intent from analysis
intent = {
    'target_family': analysis.get('target_family', 'unknown'),
    'target_domain': analysis.get('target_domain', 'small_molecule'),
    'inputs': analysis.get('suggested_inputs', []),
    'constraints': analysis.get('constraints', {}),
    'objectives': analysis.get('objectives', ['yield', 'purity']),
}

# If we have a valid intent, compile it
compiled = False
route = None
contracts = None
xdl = None

if intent.get('target_family') and intent.get('inputs'):
    try:
        route = plan(intent)
        contracts = run_preflight(route)
        xdl = lower_to_xdl(route) if contracts.get('ok') else None
        compiled = True
    except Exception as e:
        pass

print(json.dumps({
    'success': True,
    'input_smiles': smiles,
    'analysis': analysis,
    'intent': intent,
    'compiled': compiled,
    'route': route,
    'contracts': contracts,
    'xdl': xdl,
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

export default new ChemiframeSmilesInput();
