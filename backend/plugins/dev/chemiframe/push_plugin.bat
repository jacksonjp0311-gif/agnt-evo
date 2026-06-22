@echo off
setlocal
cd /d "C:\Users\jacks\OneDrive\Desktop\agnt-evo\backend\plugins\dev\chemiframe"

echo === Adding files to git ===
git add -A

echo === Committing ===
git commit -m "feat: CHEMIFRAME v3.0.0 — self-contained AGNT plugin

- 9 tools: demo, blueprints, compile, validate, simulate, retrosynthesis, execute, check-env, quickstart
- 14 reaction blueprints across small molecule, biopolymer, and chemo-bio domains
- 3-tier simulation engine (RDKit -> IBM RXN -> rule-based)
- 4-contract safety verification system
- Bundled Python source (chemiframe_py/) — fully self-contained
- Professional README with badges, architecture docs, and evolution roadmap

Files changed:
- README.md (professional grade documentation)
- .gitignore
- package.json
- manifest.json
- 11 JS tool files
- chemiframe_py/ (35 Python files)
- test_pipeline.py
- test_all.py"