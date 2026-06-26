// chemiframe-quickstart.js — v3.0.0
// Returns a curated quickstart guide with example intents for each domain.
// Pure JS — no Python needed. Helps new users get started immediately.

class ChemiframeQuickstart {
  constructor() {
    this.name = 'chemiframe-quickstart';
    this.examples = {
      small_molecule: {
        title: 'Suzuki Coupling',
        description: 'Cross-couple an aryl halide with a boronic acid',
        intent: `target_family: aryl_coupled_scaffold
target_domain: small_molecule
inputs: [aryl_halide, boronic_acid]
constraints:
  max_steps: 6
  green_solvents_only: true
  min_detectability_score: 0.90
objectives: [yield, purity, atom_economy]`,
        expected_blueprint: 'aryl_coupling',
      },
      grignard: {
        title: 'Grignard Addition',
        description: 'Add a Grignard reagent to an aldehyde',
        intent: `target_family: grignard_alcohol
target_domain: small_molecule
inputs: [grignard_reagent, aldehyde]
constraints:
  max_steps: 6
  anhydrous: true
objectives: [yield, purity]`,
        expected_blueprint: 'grignard_addition',
      },
      diels_alder: {
        title: 'Diels-Alder Cycloaddition',
        description: '[4+2] cycloaddition between diene and dienophile',
        intent: `target_family: cyclohexene
target_domain: small_molecule
inputs: [diene, dienophile]
constraints:
  max_steps: 6
objectives: [yield, stereoselectivity]`,
        expected_blueprint: 'diels_alder',
      },
      click: {
        title: 'Click Chemistry (CuAAC)',
        description: 'Copper-catalyzed azide-alkyne cycloaddition',
        intent: `target_family: triazole
target_domain: small_molecule
inputs: [azide, alkyne]
constraints:
  max_steps: 6
objectives: [yield, purity]`,
        expected_blueprint: 'click_chemistry',
      },
      oligonucleotide: {
        title: 'Oligonucleotide Synthesis',
        description: 'Solid-phase DNA synthesis with a short sequence',
        intent: `target_family: sequence_assembly
target_domain: oligonucleotide_synthesis
sequence: [A, T, G, C, A, T]
inputs: [phosphoramidite_A, phosphoramidite_T, phosphoramidite_G, phosphoramidite_C]
constraints:
  max_steps: 20
objectives: [yield, purity]`,
        expected_blueprint: 'oligo_assembly',
      },
      hybrid: {
        title: 'Hybrid Chemo-Bio Protocol',
        description: 'Chemical transformation coupled to biological readout',
        intent: `target_family: hybrid_chemo_bio
target_domain: hybrid_chemo_bio
chemical_segment: [aryl_halide, boronic_acid]
bio_segment: [enzyme_catalyst, substrate]
interface_state:
  coupling_mode: bounded
  verification: real_time
inputs: [aryl_halide, boronic_acid, enzyme_catalyst]
constraints:
  max_steps: 8
  green_solvents_only: true
objectives: [yield, bio_activity]`,
        expected_blueprint: 'hybrid_chemo_bio',
      },
    };
  }

  async execute(params) {
    try {
      const { format } = params;
      if (format === 'json') {
        return { success: true, examples: this.examples, count: Object.keys(this.examples).length };
      }
      // Default: return a markdown-formatted guide
      let guide = '# CHEMIFRAME Quickstart Guide\n\n';
      guide += 'Copy any intent below and use it with **CHEMIFRAME Compile** or **CHEMIFRAME Simulate**.\n\n';
      for (const [key, ex] of Object.entries(this.examples)) {
        guide += `## ${ex.title}\n`;
        guide += `${ex.description}\n\n`;
        guide += `Expected blueprint: \`${ex.expected_blueprint}\`\n\n`;
        guide += '```yaml\n' + ex.intent + '\n```\n\n---\n\n';
      }
      return { success: true, guide, examples: this.examples };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

export default new ChemiframeQuickstart();
