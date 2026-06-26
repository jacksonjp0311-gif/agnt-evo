// chemiframe-demo.js — v3.0.0
// Run a CHEMIFRAME demo pipeline with a pre-built example intent.
// Supports: small_molecule (Suzuki), sequence (oligonucleotide), hybrid (chemo-bio).

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const CHEMIFRAME_PYTHON = path.resolve(path.dirname(__filename), 'chemiframe_py');

const DEMO_INTENTS = {
  small_molecule: {
    target_family: 'aryl_coupled_scaffold',
    target_domain: 'small_molecule',
    inputs: ['aryl_halide', 'boronic_acid'],
    constraints: { max_steps: 6, green_solvents_only: true, min_detectability_score: 0.90 },
    objectives: ['yield', 'purity', 'atom_economy'],
  },
  sequence: {
    target_family: 'sequence_assembly',
    target_domain: 'oligonucleotide_synthesis',
    sequence: ['A', 'T', 'G', 'C', 'A', 'T'],
    inputs: ['phosphoramidite_A', 'phosphoramidite_T', 'phosphoramidite_G', 'phosphoramidite_C'],
    constraints: { max_steps: 20 },
    objectives: ['yield', 'purity'],
  },
  hybrid: {
    target_family: 'hybrid_chemo_bio',
    target_domain: 'hybrid_chemo_bio',
    chemical_segment: ['aryl_halide', 'boronic_acid'],
    bio_segment: ['enzyme_catalyst', 'substrate'],
    interface_state: { coupling_mode: 'bounded', verification: 'real_time' },
    inputs: ['aryl_halide', 'boronic_acid', 'enzyme_catalyst'],
    constraints: { max_steps: 8, green_solvents_only: true },
    objectives: ['yield', 'bio_activity'],
  },
};

class ChemiframeDemo {
  constructor() { this.name = 'chemiframe-demo'; }

  async execute(params) {
    try {
      const { demo_type, simulate } = params;
      const type = demo_type || 'small_molecule';
      const doSim = simulate !== false; // default true

      const intent = DEMO_INTENTS[type];
      if (!intent) return { success: false, error: `Unknown demo_type: ${type}. Available: ${Object.keys(DEMO_INTENTS).join(', ')}` };

      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chemiframe-demo-'));
      const intentFile = path.join(tmpDir, 'demo_intent.json');
      fs.writeFileSync(intentFile, JSON.stringify(intent, null, 2), 'utf-8');

      const script = `
import sys, json
sys.path.insert(0, '${CHEMIFRAME_PYTHON.replace(/\\/g, '/')}')
from chemiframe.demo_support import run_pipeline

with open('${intentFile.replace(/\\/g, '/')}') as f:
    intent = json.load(f)

report = run_pipeline(intent, simulate=${doSim ? 'True' : 'False'})
print(json.dumps(report))
`;

      const result = await this._runPython(script, tmpDir);
      try { fs.rmSync(tmpDir, { recursive: true }); } catch (e) { /* ok */ }
      if (!result.success) return { success: false, error: result.error || 'Demo failed' };
      return { success: true, demo_type: type, ...result };
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

export default new ChemiframeDemo();
