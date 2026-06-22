// chemiframe-check-env.js — v3.0.0
// Checks the runtime environment: Python availability, RDKit, IBM RXN API key.
// Pure JS — spawns python --version and checks for rdkit import.

import { spawn } from 'child_process';

class ChemiframeCheckEnv {
  constructor() { this.name = 'chemiframe-check-env'; }

  async execute() {
    const result = { success: true, python: null, rdkit: false, ibm_rxn: false, warnings: [] };

    // Check Python
    result.python = await new Promise((resolve) => {
      const proc = spawn('python', ['--version'], { timeout: 10000 });
      let out = '', err = '';
      proc.stdout.on('data', d => { out += d; });
      proc.stderr.on('data', d => { err += d; });
      proc.on('close', code => {
        const ver = (out || err).trim();
        resolve(code === 0 ? ver : null);
      });
      proc.on('error', () => resolve(null));
    });

    if (!result.python) {
      result.success = false;
      result.warnings.push('Python not found on PATH. Install Python 3.8+ to use CHEMIFRAME.');
      return result;
    }

    // Check RDKit
    result.rdkit = await new Promise((resolve) => {
      const proc = spawn('python', ['-c', 'from rdkit import Chem; print("ok")'], { timeout: 15000 });
      let out = '';
      proc.stdout.on('data', d => { out += d; });
      proc.on('close', code => resolve(code === 0 && out.trim() === 'ok'));
      proc.on('error', () => resolve(false));
    });

    if (!result.rdkit) {
      result.warnings.push('RDKit not installed. Simulation will use rule-based fallback. Install with: pip install rdkit-pypi');
    }

    // Check IBM RXN API key
    result.ibm_rxn = !!process.env.RXN4CHEMISTRY_API_KEY;
    if (!result.ibm_rxn) {
      result.warnings.push('RXN4CHEMISTRY_API_KEY not set. IBM RXN cloud simulation unavailable. Set the env var to enable.');
    }

    result.simulation_tier = result.rdkit ? 'rdkit' : 'rule_based';
    result.active_tier = result.rdkit ? 'Tier 1 (RDKit)' : 'Tier 3 (Rule-based)';

    return result;
  }
}

export default new ChemiframeCheckEnv();
