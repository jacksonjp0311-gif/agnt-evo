# AGNT Plugin: CHEMIFRAME — High-Level Chemical Programming

[![AGNT Plugin](https://img.shields.io/badge/AGNT-Plugin-blue.svg)](https://agnt.gg) [![Version](https://img.shields.io/badge/version-3.0.0-green.svg)](https://github.com/jacksonjp0311-gif/CHEMIFRAME-AGENT-PLUGIN) [![License](https://img.shields.io/badge/license-MIT-yellow.svg)](LICENSE) [![Python](https://img.shields.io/badge/python-3.8%2B-brightgreen.svg)](https://python.org)

**CHEMIFRAME** is a self-contained AGNT plugin that gives AI agents the ability to program chemistry at a high level. Describe what molecule to synthesize, what starting materials you have, and what constraints matter — and get back a fully verified synthesis route with safety contracts, simulation results, and executable XDL protocols.

---

## Table of Contents

- [What It Does](#what-it-does)
- [Installation](#installation)
- [The 9 Tools](#the-9-tools)
- [The 14 Blueprints](#the-14-blueprints)
- [Quick Start](#quick-start)
- [Simulation Engine](#simulation-engine)
- [Contract-First Safety](#contract-first-safety)
- [Architecture](#architecture)
- [Requirements](#requirements)
- [5 Ways to Evolve This Tool](#5-ways-to-evolve-this-tool)
- [Expansion Plan (3-Month Roadmap)](#expansion-plan-3-month-roadmap)
- [License](#license)

---

## What It Does

```
Intent (YAML/JSON) → Blueprint Selection → Route Planning → Contract Verification
→ XDL Compilation → Simulation/Execution → Trace & Audit
```

CHEMIFRAME turns natural-language chemical intent into structured, verified, executable protocols. It's a domain-specific compiler for chemistry — and now AGNT agents can use it as a tool.

**Key capabilities:**
- **Route planning** — Automatically selects the best reaction blueprint and plans step-by-step synthesis
- **Contract verification** — 4 safety checks run on every route before execution
- **Reaction simulation** — Three-tier engine (RDKit → IBM RXN API → rule-based fallback)
- **Retrosynthesis** — Predict disconnection strategies from a target molecule
- **XDL generation** — Produces executable protocols in the standard XDL format
- **Full traceability** — Every run produces a trace file for audit and reproducibility

---

## Installation

### From the AGNT Marketplace

Install directly in AGNT:

```
/plugins install chemiframe
```

### From This Repository

1. Build the `.agnt` package:
   ```bash
   cd backend/plugins
   node build-plugin.js chemiframe
   ```

2. Install via the AGNT API:
   ```bash
   curl -X POST http://localhost:3333/api/plugins/install-file \
     -H "Authorization: Bearer $AGNT_AUTH_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"name":"chemiframe","fileName":"chemiframe.agnt","fileData":"<base64>"}'
   ```

3. Reload plugins:
   ```bash
   curl -X POST http://localhost:3333/api/plugins/reload \
     -H "Authorization: Bearer $AGNT_AUTH_TOKEN"
   ```

### Prerequisites

- **AGNT** with plugin system enabled
- **Python 3.8+** on PATH (`python` command must work)
- **RDKit** (optional) — `pip install rdkit-pypi` for Tier 1 simulation
- **IBM RXN API Key** (optional) — set `RXN4CHEMISTRY_API_KEY` env var for Tier 2 cloud simulation

---

## The 9 Tools

| Tool | Purpose | Python Required |
|------|---------|:---:|
| **CHEMIFRAME Demo** | Run pre-built demos (Suzuki coupling, oligonucleotide synthesis, or chemo-bio hybrid) | ✅ |
| **CHEMIFRAME Blueprints** | List all 14 reaction blueprints with admissibility criteria, step templates, typical yields, catalysts, and temperatures | ❌ |
| **CHEMIFRAME Compile** | Full pipeline: intent → route → contracts → XDL | ✅ |
| **CHEMIFRAME Validate** | Run contract verification only (4 safety checks) | ✅ |
| **CHEMIFRAME Simulate** | Three-tier simulation (RDKit → IBM RXN → rule-based) | ✅ |
| **CHEMIFRAME Retrosynthesis** | Predict disconnection strategies from target name or SMILES | ✅ |
| **CHEMIFRAME Execute** | Full compile → verify → execute → trace | ✅ |
| **CHEMIFRAME Check Environment** | Verify Python, RDKit, API key status | ❌ |
| **CHEMIFRAME Quickstart** | Curated example intents for every domain | ❌ |

---

## The 14 Blueprints

### Small Molecule Synthesis (8)

| Blueprint | Reaction | Typical Yield | Catalyst | Temperature |
|-----------|----------|---------------|----------|-------------|
| Aryl Coupling | Suzuki-Miyaura cross-coupling | 70–95% | Pd(PPh₃)₄ | 80–100°C |
| Grignard Addition | Organomagnesium + carbonyl → alcohol | 75–90% | None (stoich. Mg) | 0°C to reflux |
| Diels-Alder | [4+2] Cycloaddition | 60–95% | Thermal / Lewis acid | 80–150°C |
| Click Chemistry | CuAAC azide-alkyne cycloaddition | 85–99% | CuSO₄/ascorbate | RT |
| Friedel-Crafts | Electrophilic aromatic substitution | 60–85% | AlCl₃ | 0°C to RT |
| Reductive Amination | Carbonyl + amine → amine | 65–90% | NaBH(OAc)₃ | RT |
| SNAr | Nucleophilic aromatic substitution | 50–85% | None | 60–120°C |
| Enzymatic | Biocatalytic transformation | 70–99% | Enzyme | 25–40°C |

### Biopolymer & Hybrid (3)

| Blueprint | Domain | Description |
|-----------|--------|-------------|
| Sequence Assembly | sequence_defined_biopolymer | Iterative monomer coupling (90–99%/cycle) |
| Oligo Assembly | oligonucleotide_synthesis | Solid-phase DNA/RNA synthesis |
| Hybrid Chemo-Bio | hybrid_chemo_bio | Bounded chemo-bio coupling with verification |

### Utility (3)

**Protection / Deprotection / Purification** — Functional group strategies for multi-step synthesis.

---

## Quick Start

### 1. Check Your Environment

Use **CHEMIFRAME Check Environment** to verify your setup. It tells you:
- Python version
- RDKit availability
- IBM RXN API key status
- Which simulation tier is active

### 2. Run a Demo

Use **CHEMIFRAME Demo** with `demo_type: small_molecule` to see a complete Suzuki coupling pipeline — compilation, verification, simulation, and trace.

### 3. Get Example Intents

Use **CHEMIFRAME Quickstart** to get copy-paste-ready intent YAML for all 6 supported domains.

### 4. Compile Your Own Intent

```yaml
target_family: aryl_coupled_scaffold
target_domain: small_molecule
inputs: [aryl_halide, boronic_acid]
constraints:
  max_steps: 6
  green_solvents_only: true
  min_detectability_score: 0.90
objectives: [yield, purity, atom_economy]
```

**Expected output:**
```
✅ Blueprint: aryl_coupling (Suzuki-Miyaura)
✅ Route: 6 steps (charge_reactor → add_catalyst → heat_and_stir → monitor_conversion → workup → purify)
✅ Contracts: detectability=0.95, assembly_bound=6_steps, dec_points=monitor_conversion, admissible=true
✅ XDL: <procedure id="route_aryl_001" blueprint="aryl_coupling">...</procedure>
✅ Simulation: 70-95% yield, 2 DEC events
```

### 5. Try Retrosynthesis

Use **CHEMIFRAME Retrosynthesis** with a target name (`triazole`, `cyclohexene`, `alcohol`) or a SMILES string to get predicted disconnection strategies.

---

## Expansion Plan (3-Month Roadmap)

See **SCOPE_AND_ROADMAP.md** for the full detailed plan covering MVP → Beta → GA delivery across 9 weeks, including:
- Real-time hardware integration (Opentrons, HPLC, reactors) via XDL
- AI-powered retrosynthesis with local and cloud LLMs
- Reaction database lookups against PubChem and ChEMBL
- Multi-step campaign planning with cost optimization

---

## Architecture

The plugin is **fully self-contained**. The entire CHEMIFRAME Python framework is bundled as `chemiframe_py/` inside the `.agnt` package — no external dependencies beyond Python on PATH.

```
chemiframe/
├── manifest.json              ← Plugin metadata + 9 tool schemas
├── package.json               ← ES module manifest
├── chemiframe_py/             ← Bundled CHEMIFRAME Python source
│   ├── intent/                ← YAML/JSON intent parser
│   ├── blueprints/            ← 14 reaction blueprints
│   ├── planner/               ← Blueprint selection + route planning
│   ├── compiler/              ← IR + XDL code generation
│   ├── verify/                ← 4 contract verification modules
│   ├── runtime/               ← Orchestrator + state machine + trace
│   └── adapters/              ← Simulator + hardware connectors
├── chemiframe-compile.js      ← Full compilation pipeline tool
├── chemiframe-validate.js     ← Contract verification tool
├── chemiframe-simulate.js     ← Three-tier simulation tool
├── chemiframe-retrosynthesis.js ← Retrosynthesis prediction tool
├── chemiframe-execute.js      ← End-to-end execution tool
├── chemiframe-demo.js         ← Pre-built demo runner tool
├── chemiframe-blueprints.js   ← Blueprint catalog tool
├── chemiframe-check-env.js    ← Environment checker tool
└── chemiframe-quickstart.js   ← Example intents tool
```

**How it works:** The JS tool files spawn Python child processes, passing intent data via temp files. The Python source resolves paths relative to `__dirname` (the installed plugin location), making the package fully portable.

---

## Requirements

| Dependency | Required | Purpose |
|-----------|----------|---------|
| **AGNT** | ✅ | Plugin host |
| **Python 3.8+** | ✅ | Runs the CHEMIFRAME pipeline |
| **RDKit** | Optional | `pip install rdkit-pypi` for Tier 1 simulation |
| **IBM RXN API Key** | Optional | Set `RXN4CHEMISTRY_API_KEY` env var for Tier 2 cloud simulation |

---

## 5 Ways to Evolve This Tool

### 1. 🔗 Real-Time Lab Hardware Integration

Connect CHEMIFRAME to actual wet-lab automation hardware — liquid handlers (Opentrons, Tecan), reactors (H.E.L, Mettler Toledo), and analytical instruments (HPLC, LC-MS) via standard protocols. The XDL output format is already designed for this. Adding a hardware adapter layer would close the loop from "AI plans synthesis" → "robot executes synthesis" → "analytical data feeds back to AI for adaptive replanning."

**Impact:** Transforms the plugin from a planning tool into a full closed-loop autonomous chemistry platform.

### 2. 🧠 AI-Powered Retrosynthesis with Large Language Models

Replace or augment the rule-based retrosynthesis with a fine-tuned LLM trained on reaction databases (Reaxys, Pistachio, USPTO). The LLM could propose novel disconnection strategies beyond the 14 template blueprints, suggest alternative routes when a preferred one fails verification, and reason about stereoselectivity and regioselectivity in ways that template-based systems cannot.

**Impact:** Moves from "select from known templates" to "AI-invented synthetic routes" — dramatically expanding the chemical space the plugin can navigate.

### 3. 📊 Reaction Database Integration

Connect to public and proprietary reaction databases — PubChem, ChEMBL, Reaxys, SciFinder — to validate predicted reactions against real experimental data. Before simulating a route, the plugin could check if similar reactions have been performed, what yields were actually achieved, and what side products were observed. This grounds the simulation in empirical reality.

**Impact:** Bridges the gap between theoretical simulation and experimental reality — routes become data-informed rather than purely model-based.

### 4. 🔄 Multi-Step Campaign Planning with Optimization

Extend from single-reaction planning to full multi-step synthesis campaign optimization. Given a complex target molecule, the plugin would plan the entire synthetic sequence — choosing which steps to run in parallel, optimizing the order for yield and cost, managing intermediate purification, and scheduling around equipment availability. Add a cost model that includes reagent prices, solvent disposal, and time.

**Impact:** Elevates the tool from "single reaction planner" to "full synthesis campaign optimizer" — the difference between a calculator and an ERP system for chemistry.

### 5. 🌐 Collaborative Protocol Sharing & Marketplace

Build a community layer where chemists can share, rate, and fork synthesis protocols. Successful routes become reusable templates. Chemists in Tokyo run a Suzuki coupling, the validated protocol gets published to the marketplace, and a chemist in Berlin can install it, adapt it for their specific substrates, and run it on their hardware. Combine with the contract verification system to ensure shared protocols meet safety standards before execution.

**Impact:** Creates a network effect — every successful synthesis makes the entire community smarter. This is the "GitHub for chemistry protocols" vision.

---

## License

MIT License. See [LICENSE](LICENSE) for details.

---

## Author

**James Paul Jackson** — [jacksonjp0311-gif](https://github.com/jacksonjp0311-gif)

**Source Framework:** [CHEMIFRAME](https://github.com/jacksonjp0311-gif/CHEMIFRAME)

---

## Contributing

This plugin is part of the CHEMIFRAME ecosystem. Contributions to either the [Python framework](https://github.com/jacksonjp0311-gif/CHEMIFRAME) or this [AGNT plugin](https://github.com/jacksonjp0311-gif/CHEMIFRAME-AGENT-PLUGIN) are welcome.

To add a new blueprint:
1. Create a new class in `chemiframe_py/blueprints/` extending `ChemicalBlueprint`
2. Implement `admissibility()`, `plan()`, and `verify()`
3. Register it in `chemiframe_py/planner/search.py`
4. Add it to the catalog in `chemiframe-blueprints.js`
5. Rebuild with `node build-plugin.js chemiframe`

For the expansion features (hardware, LLM retro, DB, UI), see **SCOPE_AND_ROADMAP.md** for detailed technical specifications.