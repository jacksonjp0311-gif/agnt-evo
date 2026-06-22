// chemiframe-compile.js — v3.0.0
// Compiles a chemical intent into a verified route with contracts and XDL artifact.
// Self-contained: resolves Python source relative to the plugin's own directory.

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(filename);

// Resolve bundled Python source: <plugin-install-dir>/chemiframe_py/
const CHEMIFRAME_PYTHON = path.resolve(__dirname, 'chemiframe_py');

class ChemiframeCompile {
  constructor() {
    this.name = 'chemiframe-compile';
  }

  async execute(params, inputData, workflowEngine) {
    try {
      const { intent, domain } = params;
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

intent = load_intent('${intentFile.replace(/\\/g, '/')}')
${domain ? `intent['target_domain'] = '${domain}'` : ''}

route = plan(intent)
contracts = run_preflight(route)
xdl = lower_to_xdl(route) if contracts.get('ok') else None

print(json.dumps({
    'route': route,
    'contracts': contracts,
    'xdl': xdl,
    'route_id': route.get('route_id', 'unknown'),
    'blueprint': route.get('family', 'unknown'),
    'success': True
}))
`;

      const result = await this._runPython(script, tmpDir);
      try { fs.rmSync(tmpDir, { recursive: true }); } catch (e) { /* ok */ }

      if (!result.success) return { success: false, error: result.error || 'Compilation failed' };
      return result;
    } catch (error) {
      console.error(`[${this.name}] Error:`, error);
      return { success: false, error: error.message };
    }
  }

  _runPython(script, cwd) {
    return new Promise((resolve) => {
      const proc = spawn('python', ['-c', script], {
        cwd, env: { ...process.env, PYTHONIOENCODING: 'utf-8' }, timeout: 30000,
      });
      let stdout = '', stderr = '';
      proc.stdout.on('data', d => { stdout += d; });
      proc.stderr.on('data', d => { stderr += d; });
      proc.on('close', code => {
        if (code !== 0) return resolve({ success: false, error: stderr || `Exit code ${code}` });
        try {
          const lines = stdout.trim().split('\n');
          resolve(JSON.parse(lines[lines.length - 1]));
        } catch (e) {
          resolve({ success: false, error: `Parse error: ${e.message}`, raw: stdout });
        }
      });
      proc.on('error', err => resolve({ success: false, error: `Spawn error: ${err.message}` }));
    });
  }
}

export default new ChemiframeCompile();
