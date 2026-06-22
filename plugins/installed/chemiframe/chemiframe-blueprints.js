// chemiframe-blueprints.js — v3.0.0
// Lists all available chemical reaction blueprints with admissibility criteria and step templates.
// Pure JS — no Python needed since the blueprint catalog is static.

class ChemiframeBlueprints {
  constructor() {
    this.name = 'chemiframe-blueprints';
    this.catalog = [
      {
        name: 'aryl_coupling', display_name: 'Aryl Coupling (Suzuki-Miyaura)',
        domain: 'small_molecule',
        description: 'Suzuki-Miyaura cross-coupling of aryl halides with boronic acids. Forms C-C bonds between aromatic rings using palladium catalysis. Typical yield: 70-95%.',
        admissibility_criteria: ['aryl_halide in inputs', 'boronic_acid in inputs'],
        steps: [
          { op: 'AM', label: 'charge_reactor' }, { op: 'AM', label: 'add_catalyst' },
          { op: 'AE', label: 'heat_and_stir' }, { op: 'AE', label: 'monitor_conversion' },
          { op: 'SM', label: 'workup' }, { op: 'SM', label: 'purify' },
        ],
        op_legend: { AM: 'Add Material', SM: 'Remove Material', AE: 'Apply Energy', SE: 'Cool/Settle' },
        typical_yield: '70-95%', catalyst: 'Pd(PPh3)4 or PdCl2(dppf)', temperature: '80-100°C',
      },
      {
        name: 'grignard_addition', display_name: 'Grignard Addition',
        domain: 'small_molecule',
        description: 'Organomagnesium reagents (RMgX) add to carbonyl compounds (aldehydes, ketones) to form alcohols. Typical yield: 75-90%.',
        admissibility_criteria: ['grignard_reagent in inputs', 'aldehyde or ketone in inputs'],
        steps: [
          { op: 'AM', label: 'charge_reactor' }, { op: 'AE', label: 'dry_solvent' },
          { op: 'AM', label: 'add_grignard' }, { op: 'AE', label: 'stir_cold' },
          { op: 'AM', label: 'quench' }, { op: 'SM', label: 'extract' },
        ],
        typical_yield: '75-90%', catalyst: 'None (stoichiometric Mg)', temperature: '0°C to reflux',
      },
      {
        name: 'diels_alder', display_name: 'Diels-Alder Cycloaddition',
        domain: 'small_molecule',
        description: '[4+2] Cycloaddition between a diene and dienophile to form cyclohexene derivatives. Typical yield: 60-95%.',
        admissibility_criteria: ['diene in inputs', 'dienophile in inputs'],
        steps: [
          { op: 'AM', label: 'charge_reactor' }, { op: 'AM', label: 'add_diene' },
          { op: 'AM', label: 'add_dienophile' }, { op: 'AE', label: 'heat' },
          { op: 'AE', label: 'monitor_conversion' }, { op: 'SM', label: 'purify' },
        ],
        typical_yield: '60-95%', catalyst: 'Thermal or Lewis acid', temperature: '80-150°C',
      },
      {
        name: 'click_chemistry', display_name: 'Click Chemistry (CuAAC)',
        domain: 'small_molecule',
        description: 'Copper-catalyzed azide-alkyne cycloaddition (CuAAC). Highly reliable, bioorthogonal. Typical yield: 85-99%.',
        admissibility_criteria: ['azide in inputs', 'alkyne in inputs'],
        steps: [
          { op: 'AM', label: 'charge_reactor' }, { op: 'AM', label: 'add_azide' },
          { op: 'AM', label: 'add_alkyne' }, { op: 'AM', label: 'add_cu_catalyst' },
          { op: 'AE', label: 'stir_rt' }, { op: 'SM', label: 'purify' },
        ],
        typical_yield: '85-99%', catalyst: 'CuSO₄/sodium ascorbate', temperature: 'RT',
      },
      {
        name: 'friedel_crafts', display_name: 'Friedel-Crafts Acylation',
        domain: 'small_molecule',
        description: 'Electrophilic aromatic substitution with acyl halides. Forms aryl ketones. Typical yield: 60-85%.',
        admissibility_criteria: ['aromatic in inputs', 'acyl_halide in inputs', 'alcl3 in inputs'],
        steps: [
          { op: 'AM', label: 'charge_reactor' }, { op: 'AM', label: 'add_alcl3' },
          { op: 'AM', label: 'add_acyl_halide' }, { op: 'AE', label: 'stir' },
          { op: 'SM', label: 'quench' }, { op: 'SM', label: 'extract' },
        ],
        typical_yield: '60-85%', catalyst: 'AlCl₃', temperature: '0°C to RT',
      },
      {
        name: 'reductive_amination', display_name: 'Reductive Amination',
        domain: 'small_molecule',
        description: 'Carbonyl compound + amine → imine → reduced to amine. Typical yield: 65-90%.',
        admissibility_criteria: ['carbonyl in inputs', 'amine in inputs', 'nabh3cn in inputs'],
        steps: [
          { op: 'AM', label: 'charge_reactor' }, { op: 'AM', label: 'add_carbonyl' },
          { op: 'AM', label: 'add_amine' }, { op: 'AM', label: 'add_reducing_agent' },
          { op: 'AE', label: 'stir' }, { op: 'SM', label: 'purify' },
        ],
        typical_yield: '65-90%', catalyst: 'NaBH(OAc)₃', temperature: 'RT',
      },
      {
        name: 'snar', display_name: 'SNAr (Nucleophilic Aromatic Substitution)',
        domain: 'small_molecule',
        description: 'Nucleophilic substitution on electron-deficient aromatic rings. Typical yield: 50-85%.',
        admissibility_criteria: ['fluoronitrobenzene in inputs', 'nucleophile in inputs'],
        steps: [
          { op: 'AM', label: 'charge_reactor' }, { op: 'AM', label: 'add_substrate' },
          { op: 'AM', label: 'add_nucleophile' }, { op: 'AE', label: 'heat' },
          { op: 'AE', label: 'monitor' }, { op: 'SM', label: 'purify' },
        ],
        typical_yield: '50-85%', catalyst: 'None', temperature: '60-120°C',
      },
      {
        name: 'enzymatic', display_name: 'Enzymatic / Biocatalytic',
        domain: 'small_molecule',
        description: 'Biocatalytic transformations using enzymes. High selectivity, green chemistry. Typical yield: 70-99%.',
        admissibility_criteria: ['enzyme in inputs', 'substrate in inputs'],
        steps: [
          { op: 'AM', label: 'prepare_buffer' }, { op: 'AM', label: 'add_enzyme' },
          { op: 'AM', label: 'add_substrate' }, { op: 'AE', label: 'incubate' },
          { op: 'AE', label: 'monitor' }, { op: 'SM', label: 'quench' },
        ],
        typical_yield: '70-99%', catalyst: 'Enzyme', temperature: '25-40°C',
      },
      {
        name: 'sequence_assembly', display_name: 'Sequence Assembly',
        domain: 'sequence_defined_biopolymer',
        description: 'Iterative monomer coupling for sequence-defined biopolymers. 90-99% yield per cycle.',
        admissibility_criteria: ['sequence field present', 'target_domain in [sequence_defined_biopolymer, oligonucleotide_synthesis]'],
        steps: 'dynamic (generated from sequence array)',
        step_template: 'For each unit: couple → wash → checkpoint, then final_release',
        typical_yield: '90-99%/cycle',
      },
      {
        name: 'oligo_assembly', display_name: 'Oligonucleotide Assembly',
        domain: 'oligonucleotide_synthesis',
        description: 'Solid-phase oligonucleotide synthesis via iterative phosphoramidite coupling. For DNA/RNA synthesis.',
        admissibility_criteria: ['sequence field present', 'target_domain == oligonucleotide_synthesis'],
        steps: 'dynamic (generated from sequence array)',
        parent: 'sequence_assembly',
        typical_yield: '90-99%/cycle',
      },
      {
        name: 'hybrid_chemo_bio', display_name: 'Hybrid Chemo-Bio Interface',
        domain: 'hybrid_chemo_bio',
        description: 'Bounded coupling between chemical and biological segments. Executes chemical transformation, verifies interface state, then delivers to biological readout.',
        admissibility_criteria: ['target_domain == hybrid_chemo_bio', 'chemical_segment in intent', 'bio_segment in intent', 'interface_state in intent'],
        steps: [
          { op: 'AM', label: 'charge_precursors' }, { op: 'AE', label: 'execute_primary_transformation' },
          { op: 'AE', label: 'verify_interface_state' }, { op: 'AM', label: 'bounded_delivery' },
          { op: 'AE', label: 'bio_readout_checkpoint' },
        ],
        typical_yield: 'varies',
      },
      {
        name: 'protection', display_name: 'Protection',
        domain: 'small_molecule',
        description: 'Functional group protection strategy. Adds protecting groups to prevent unwanted side reactions during multi-step synthesis.',
        admissibility_criteria: ['always admissible (utility)'], steps: [],
      },
      {
        name: 'deprotection', display_name: 'Deprotection',
        domain: 'small_molecule',
        description: 'Removal of protecting groups after synthetic steps are complete. Restores original functional group reactivity.',
        admissibility_criteria: ['always admissible (utility)'], steps: [],
      },
      {
        name: 'purification', display_name: 'Purification',
        domain: 'small_molecule',
        description: 'Isolation and purification of target compounds via chromatography, crystallization, or extraction.',
        admissibility_criteria: ['always admissible (utility)'], steps: [],
      },
    ];
  }

  async execute(params) {
    try {
      const { domain_filter } = params;
      let blueprints = this.catalog;
      if (domain_filter && domain_filter !== 'all') {
        blueprints = blueprints.filter(b => b.domain === domain_filter);
      }
      return { success: true, blueprints, count: blueprints.length };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

export default new ChemiframeBlueprints();
