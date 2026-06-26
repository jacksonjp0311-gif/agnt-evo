@echo off
cd /d "C:\Users\jacks\OneDrive\Desktop\agnt-evo"
git reset HEAD -- .
git rm -r --cached "backend/plugins/dev/aetherscop-afm" 2>nul
git rm -r --cached "backend/plugins/dev/atlas-cloud" 2>nul
git rm -r --cached "backend/plugins/dev/bankr-plugin" 2>nul
git rm -r --cached "backend/plugins/dev/chat-actions-strip" 2>nul
git rm -r --cached "backend/plugins/dev/chemiframe" 2>nul
git rm -r --cached "backend/plugins/dev/improve" 2>nul
git rm -r --cached "backend/plugins/dev/neuralforge" 2>nul
git rm -r --cached "backend/plugins/dev/operation-timer" 2>nul
git rm -r --cached "backend/plugins/dev/plaid-plugin" 2>nul
git rm -r --cached "backend/plugins/dev/polymarket-plugin" 2>nul
git rm -r --cached "backend/plugins/dev/triadix-governance" 2>nul
git rm -r --cached "backend/plugins/dev/triadix-ledger" 2>nul
git rm -r --cached "neuralforge" 2>nul
git rm -r --cached "rddc-evolution" 2>nul
git rm -r --cached "agnt-auditor" 2>nul
git rm -r --cached "code-critic" 2>nul
git rm -r --cached "improve-AGNT" 2>nul
git rm -r --cached "_migration_from_broken_20260622_000453" 2>nul
git rm -r --cached "_plugin_investigation_20260622_011003" 2>nul
git rm -r --cached "_plugin_memory_restore_20260622_002555" 2>nul
git rm -r --cached "_publish" 2>nul
echo Done removing files from tracking.
git status --short
