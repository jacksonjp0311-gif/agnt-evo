// chemiframe-nl-parse.js — Evolution #1: Natural Language Intent Parser
// Translates plain English chemical descriptions into structured CHEMIFRAME intents.
// Uses rule-based extraction (no API dependency) with an optional LLM enhancement path.

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const CHEMIFRAME_PYTHON = path.resolve(path.dirname(__filename), 'chemiframe_py');

// ---------------------------------------------------------------------------
// Rule-based NL intent extractor (always available, no API key needed)
// ---------------------------------------------------------------------------

const REACTION_KEYWORDS = {
  suzuki: { target_family: 'aryl_coupled_scaffold', inputs: ['aryl_halide', 'boronic_acid'], blueprint: 'aryl_coupling' },
  'suzuki-miyaura': { target_family: 'aryl_coupled_scaffold', inputs: ['aryl_halide', 'boronic_acid'], blueprint: 'aryl_coupling' },
  'cross-coupling': { target_family: 'aryl_coupled_scaffold', inputs: ['aryl_halide', 'boronic_acid'], blueprint: 'aryl_coupling' },
  grignard: { target_family: 'grignard_alcohol', inputs: ['grignard_reagent', 'aldehyde'], blueprint: 'grignard_addition' },
  'grignard addition': { target_family: 'grignard_alcohol', inputs: ['grignard_reagent', 'aldehyde'], blueprint: 'grignard_addition' },
  'diels-alder': { target_family: 'cyclohexene', inputs: ['diene', 'dienophile'], blueprint: 'diels_alder' },
  cycloaddition: { target_family: 'cyclohexene', inputs: ['diene', 'dienophile'], blueprint: 'diels_alder' },
  click: { target_family: 'triazole', inputs: ['azide', 'alkyne'], blueprint: 'click_chemistry' },
  'click chemistry': { target_family: 'triazole', inputs: ['azide', 'alkyne'], blueprint: 'click_chemistry' },
  'cuaac': { target_family: 'triazole', inputs: ['azide', 'alkyne'], blueprint: 'click_chemistry' },
  'friedel-crafts': { target_family: 'aryl_ketone', inputs: ['aromatic', 'acyl_halide', 'alcl3'], blueprint: 'friedel_crafts' },
  acylation: { target_family: 'aryl_ketone', inputs: ['aromatic', 'acyl_halide', 'alcl3'], blueprint: 'friedel_crafts' },
  'reductive amination': { target_family: 'secondary_amine', inputs: ['carbonyl', 'amine', 'nabh3cn'], blueprint: 'reductive_amination' },
  snar: { target_family: 'substituted_aniline', inputs: ['fluoronitrobenzene', 'nucleophile'], blueprint: 'snar' },
  enzymatic: { target_family: 'enzyme_product', inputs: ['enzyme', 'substrate'], blueprint: 'enzymatic' },
  biocatalytic: { target_family: 'enzyme_product', inputs: ['enzyme', 'substrate'], blueprint: 'enzymatic' },
  protection: { target_family: 'protected_intermediate', inputs: ['substrate', 'protecting_group'], blueprint: 'protection' },
  deprotection: { target_family: 'deprotected_product', inputs: ['protected_substrate', 'deprotection_reagent'], blueprint: 'deprotection' },
  purification: { target_family: 'purified_product', inputs: ['crude_product'], blueprint: 'purification' },
  oligonucleotide: { target_family: 'oligonucleotide', inputs: ['phosphoramidites'], blueprint: 'oligo_assembly' },
  'dna synthesis': { target_family: 'oligonucleotide', inputs: ['phosphoramidites'], blueprint: 'oligo_assembly' },
  'rna synthesis': { target_family: 'oligonucleotide', inputs: ['phosphoramidites'], blueprint: 'oligo_assembly' },
  'sequence assembly': { target_family: 'biopolymer', inputs: ['monomers'], blueprint: 'sequence_assembly' },
  hybrid: { target_family: 'hybrid_product', inputs: ['chemical_segment', 'bio_segment'], blueprint: 'hybrid_chemo_bio' },
  'chemo-bio': { target_family: 'hybrid_product', inputs: ['chemical_segment', 'bio_segment'], blueprint: 'hybrid_chemo_bio' },
};

const CONSTRAINT_PATTERNS = [
  { regex: /(?:max(?:imum)?\s+)?(\d+)\s*steps?/i, key: 'max_steps', parse: m => parseInt(m[1]) },
  { regex: /green\s+solvents?\s+only/i, key: 'green_solvents_only', parse: () => true },
  { regex: /anhydrous/i, key: 'anhydrous', parse: () => true },
  { regex: /(?:min(?:imum)?\s+)?detectab(?:ility|le)\s+(?:score\s+)?(?:of\s+)?(\d+\.?\d*)/i, key: 'min_detectability_score', parse: m => parseFloat(m[1]) },
  { regex: /yield\s+(?:above|over|greater\s+than)\s+(\d+)/i, key: 'min_yield', parse: m => parseInt(m[1]) },
  { regex: /temperature\s+(?:below|under|less\s+than)\s+(\d+)/i, key: 'max_temperature', parse: m => parseInt(m[1]) },
  { regex: /budget\s+(?:under|below|less\s+than)\s+\$?(\d+)/i, key: 'max_cost', parse: m => parseInt(m[1]) },
];

const OBJECTIVE_KEYWORDS = {
  yield: 'yield',
  purity: 'purity',
  'atom economy': 'atom_economy',
  'green chemistry': 'green_chemistry',
  'low cost': 'low_cost',
  'high yield': 'yield',
  selectivity: 'selectivity',
  stereoselectivity: 'stereoselectivity',
  'shortest route': 'min_steps',
  'fastest': 'min_time',
  scalable: 'scalability',
  'bio activity': 'bio_activity',
};

function ruleBasedExtract(nlText) {
  const lower = nlText.toLowerCase();
  const result = {
    target_family: null,
    target_domain: 'small_molecule',
    inputs: [],
    constraints: {},
    objectives: [],
    confidence: 'low',
    method: 'rule_based',
  };

  // Detect reaction type
  let matched = false;
  for (const [keyword, spec] of Object.entries(REACTION_KEYWORDS)) {
    if (lower.includes(keyword)) {
      result.target_family = spec.target_family;
      result.inputs = [...spec.inputs];
      result._blueprint_hint = spec.blueprint;
      result.confidence = 'medium';
      matched = true;
      break;
    }
  }

  // Detect domain
  if (lower.includes('oligonucleotide') || lower.includes('dna') || lower.includes('rna') || lower.includes('sequence')) {
    result.target_domain = 'oligonucleotide_synthesis';
  } else if (lower.includes('hybrid') || lower.includes('chemo-bio') || lower.includes('bio_segment')) {
    result.target_domain = 'hybrid_chemo_bio';
  } else if (lower.includes('polymer') || lower.includes('peptide') || lower.includes('protein')) {
    result.target_domain = 'sequence_defined_biopolymer';
  }

  // Detect constraints
  for (const pattern of CONSTRAINT_PATTERNS) {
    const m = nlText.match(pattern.regex);
    if (m) {
      result.constraints[pattern.key] = pattern.parse(m);
    }
  }

  // Detect objectives
  for (const [keyword, objective] of Object.entries(OBJECTIVE_KEYWORDS)) {
    if (lower.includes(keyword)) {
      if (!result.objectives.includes(objective)) {
        result.objectives.push(objective);
      }
    }
  }

  // Default objectives if none detected
  if (result.objectives.length === 0) {
    result.objectives = ['yield', 'purity'];
  }

  // Detect specific substrates mentioned
  const substratePatterns = [
    { regex: /(\w+ bromide|(\w+ bromide)|bromobenzene|iodobenzene)/i, name: 'aryl_halide' },
    { regex: /(\w+ boronic acid|phenylboronic acid)/i, name: 'boronic_acid' },
    { regex: /(\w+ aldehyde|formaldehyde|acetaldehyde|benzaldehyde)/i, name: 'aldehyde' },
    { regex: /(\w+ ketone|acetone|cyclohexanone)/i, name: 'ketone' },
    { regex: /(\w+ amine|aniline|methylamine)/i, name: 'amine' },
    { regex: /(\w+ azide|azido)/i, name: 'azide' },
    { regex: /(\w+ alkyne|ethynyl|propargyl)/i, name: 'alkyne' },
    { regex: /(\w+ diene|butadiene|cyclopentadiene)/i, name: 'diene' },
    { regex: /(\w+ dienophile|maleic anhydride|acrylic)/i, name: 'dienophile' },
  ];

  for (const sp of substratePatterns) {
    if (sp.regex.test(nlText)) {
      const existing = result.inputs;
      const normalized = sp.name;
      if (!existing.includes(normalized) && existing.length < 4) {
        existing.push(normalized);
      }
    }
  }

  if (matched && result.inputs.length > 0) {
    result.confidence = 'high';
  }

  return result;
}

// ---------------------------------------------------------------------------
// Main tool class
// ---------------------------------------------------------------------------

class ChemiframeNlParse {
  constructor() { this.name = 'chemiframe-nl-parse'; }

  async execute(params) {
    try {
      const { nl_text, auto_compile } = params;
      if (!nl_text) return { success: false, error: 'Missing required parameter: nl_text' };

      const intent = ruleBasedExtract(nl_text);

      // Optionally auto-compile the extracted intent
      if (auto_compile && intent.confidence !== 'low') {
        const yaml = _toYaml(intent);
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chemiframe-nl-'));
        const intentFile = path.join(tmpDir, 'intent.yaml');
        fs.writeFileSync(intentFile, yaml, 'utf-8');

        const script = `
import sys, json
sys.path.insert(0, '${CHEMIFRAME_PYTHON.replace(/\\/g, '/')}')
from chemiframe.intent.parser import load_intent
from chemiframe.planner import plan
from chemiframe.verify.contracts import run_preflight
from chemiframe.compiler.lower_to_xdl import lower_to_xdl

intent = load_intent('${intentFile.replace(/\\/g, '/')}')
route = plan(intent)
contracts = run_preflight(route)
xdl = lower_to_xdl(route) if contracts.get('ok') else None

print(json.dumps({
    'intent': intent,
    'route': route,
    'contracts': contracts,
    'xdl': xdl,
    'compiled': True
}))
`;

        const compileResult = await this._runPython(script, tmpDir);
        try { fs.rmSync(tmpDir, { recursive: true }); } catch (e) { /* ok */ }

        if (!compileResult.success) {
          return {
            success: true,
            intent,
            intent_yaml: yaml,
            compiled: false,
            compile_error: compileResult.error,
            confidence: intent.confidence,
            method: intent.method,
          };
        }

        return {
          success: true,
          intent,
          intent_yaml: yaml,
          compiled: true,
          route: compileResult.route,
          contracts: compileResult.contracts,
          xdl: compileResult.xdl,
          confidence: intent.confidence,
          method: intent.method,
        };
      }

      return {
        success: true,
        intent,
        intent_yaml: _toYaml(intent),
        compiled: false,
        confidence: intent.confidence,
        method: intent.method,
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

function _toYaml(intent) {
  const lines = [];
  if (intent.target_family) lines.push(`target_family: ${intent.target_family}`);
  if (intent.target_domain) lines.push(`target_domain: ${intent.target_domain}`);
  if (intent.inputs && intent.inputs.length > 0) {
    lines.push(`inputs: [${intent.inputs.join(', ')}]`);
  }
  if (Object.keys(intent.constraints || {}).length > 0) {
    lines.push('constraints:');
    for (const [k, v] of Object.entries(intent.constraints)) {
      lines.push(`  ${k}: ${v}`);
    }
  }
  if (intent.objectives && intent.objectives.length > 0) {
    lines.push(`objectives: [${intent.objectives.join(', ')}]`);
  }
  return lines.join('\n');
}

export default new ChemiframeNlParse();
