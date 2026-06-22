// chemiframe-analytical.js — Evolution #7: Analytical Method Recommender
// Recommends monitoring/analytical methods for each step in a synthesis route.

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const CHEMIFRAME_PYTHON = path.resolve(path.dirname(__filename), 'chemiframe_py');

// Analytical method database keyed by operation type and step label keywords
const ANALYTICAL_METHODS = {
  charge_reactor: {
    methods: ['Visual inspection', 'Weight verification'],
    critical: false,
    frequency: 'once',
  },
  add_catalyst: {
    methods: ['Visual inspection', 'Catalyst loading verification (ICP-MS if Pd)'],
    critical: true,
    frequency: 'once',
  },
  heat_and_stir: {
    methods: ['Temperature monitoring (probe)', 'In-situ FTIR', 'Reaction sampling for TLC/HPLC'],
    critical: true,
    frequency: 'every_15_min',
  },
  monitor_conversion: {
    methods: ['HPLC (primary)', 'TLC (quick check)', 'NMR aliquot', 'In-situ ReactIR'],
    critical: true,
    frequency: 'every_30_min',
  },
  workup: {
    methods: ['pH measurement', 'Phase separation visual', 'Conductivity'],
    critical: false,
    frequency: 'once',
  },
  purify: {
    methods: ['HPLC purity check', 'NMR structural confirmation', 'LC-MS molecular weight', 'Melting point'],
    critical: true,
    frequency: 'post_purification',
  },
  add_grignard: {
    methods: ['Visual (color change)', 'Temperature exotherm monitoring', 'Karl Fischer (moisture)'],
    critical: true,
    frequency: 'continuous',
  },
  stir_cold: {
    methods: ['Temperature probe', 'TLC monitoring'],
    critical: true,
    frequency: 'every_15_min',
  },
  quench: {
    methods: ['pH monitoring', 'Gas evolution visual', 'Temperature monitoring'],
    critical: true,
    frequency: 'continuous',
  },
  extract: {
    methods: ['Phase separation visual', 'TLC of both phases'],
    critical: false,
    frequency: 'once',
  },
  add_azide: {
    methods: ['Safety check (azide shock sensitivity)', 'Visual inspection'],
    critical: true,
    frequency: 'once',
  },
  add_cu_catalyst: {
    methods: ['Visual (color change to green/blue)', 'UV-Vis monitoring'],
    critical: false,
    frequency: 'once',
  },
  stir_rt: {
    methods: ['TLC monitoring', 'HPLC at t=1h'],
    critical: true,
    frequency: 'every_30_min',
  },
  prepare_buffer: {
    methods: ['pH meter', 'Conductivity', 'Buffer capacity test'],
    critical: true,
    frequency: 'once',
  },
  add_enzyme: {
    methods: ['Activity assay', 'Protein concentration (Bradford/UV280)'],
    critical: true,
    frequency: 'once',
  },
  incubate: {
    methods: ['Temperature logging', 'Periodic sampling for HPLC', 'Activity assay'],
    critical: true,
    frequency: 'every_60_min',
  },
  couple: {
    methods: ['Ninhydrin test (for amino acids)', 'UV monitoring', 'HPLC'],
    critical: true,
    frequency: 'every_cycle',
  },
  wash: {
    methods: ['UV absorbance of wash eluent', 'Conductivity'],
    critical: false,
    frequency: 'each_wash',
  },
  checkpoint: {
    methods: ['Full analytical panel: HPLC, NMR, MS'],
    critical: true,
    frequency: 'each_checkpoint',
  },
  final_release: {
    methods: ['Final purity (HPLC)', 'Identity (NMR)', 'Yield (gravimetric)', 'MS confirmation'],
    critical: true,
    frequency: 'once',
  },
};

class ChemiframeAnalytical {
  constructor() { this.name = 'chemiframe-analytical'; }

  async execute(params) {
    try {
      const { intent } = params;
      if (!intent) return { success: false, error: 'Missing required parameter: intent' };

      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chemiframe-analytical-'));
      const intentFile = path.join(tmpDir, 'intent.yaml');
      fs.writeFileSync(intentFile, intent, 'utf-8');

      const script = `
import sys, json
sys.path.insert(0, '${CHEMIFRAME_PYTHON.replace(/\\/g, '/')}')
from chemiframe.intent.parser import load_intent
from chemiframe.planner import plan

intent = load_intent('${intentFile.replace(/\\/g, '/')}')
route = plan(intent)
steps = route.get('steps', [])

print(json.dumps({'route': route, 'steps': steps}))
`;

      const result = await this._runPython(script, tmpDir);
      try { fs.rmSync(tmpDir, { recursive: true }); } catch (e) { /* ok */ }
      if (!result.success) return { success: false, error: result.error };

      const steps = result.steps || [];
      const recommendations = [];
      let critical_count = 0;

      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const label = step.get('label', '');
        const op = step.get('op', '');

        // Find matching analytical methods
        let methods = null;
        for (const [key, val] of Object.entries(${JSON.stringify(ANALYTICAL_METHODS)})) {
          if (label.includes(key) || key.includes(label.split('_')[0])) {
            methods = val;
            break;
          }
        }

        // Default methods based on operation type
        if (!methods) {
          if (op === 'AM') methods = { methods: ['Visual inspection', 'Gravimetric verification'], critical: false, frequency: 'once' };
          else if (op === 'AE') methods = { methods: ['Temperature monitoring', 'Time tracking'], critical: true, frequency: 'continuous' };
          else if (op === 'SM') methods = { methods: ['Visual completion check', 'Weight/volume measurement'], critical: false, frequency: 'once' };
          else methods = { methods: ['Visual inspection'], critical: false, frequency: 'once' };
        }

        if (methods.critical) critical_count++;

        recommendations.push({
          step_num: i + 1,
          step_label: label,
          op,
          analytical_methods: methods.methods,
          critical_monitoring: methods.critical,
          monitoring_frequency: methods.frequency,
          agnt_automation_hint: methods.critical
            ? `AGNT should set up automated monitoring for "${label}" — this is a critical control point.`
            : `AGNT can monitor "${label}" with periodic checks.`,
        });
      }

      return {
        success: true,
        route: result.route,
        recommendations,
        summary: {
          total_steps: steps.length,
          critical_control_points: critical_count,
          recommended_instruments: [...new Set(recommendations.flatMap(r => r.analytical_methods))].slice(0, 10),
          agnt_automation_ready: true,
        },
      };
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

export default new ChemiframeAnalytical();
