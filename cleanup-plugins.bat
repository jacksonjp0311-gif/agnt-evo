@echo off
echo ============================================
echo  AGNT-EVO PLUGIN MIGRATION CLEANUP
echo ============================================
echo.

cd /d "C:\Users\jacks\OneDrive\Desktop\agnt-evo"

echo [1/6] Removing custom plugins from AGNT-EVO git tracking...

git rm -r --cached backend/plugins/dev/aetherscop-afm 2>nul
git rm -r --cached backend/plugins/dev/atlas-cloud 2>nul
git rm -r --cached backend/plugins/dev/bankr-plugin 2>nul
git rm -r --cached backend/plugins/dev/chat-actions-strip 2>nul
git rm -r --cached backend/plugins/dev/chemiframe 2>nul
git rm -r --cached backend/plugins/dev/improve 2>nul
git rm -r --cached backend/plugins/dev/neuralforge 2>nul
git rm -r --cached backend/plugins/dev/operation-timer 2>nul
git rm -r --cached backend/plugins/dev/plaid-plugin 2>nul
git rm -r --cached backend/plugins/dev/polymarket-plugin 2>nul
git rm -r --cached backend/plugins/dev/triadix-governance 2>nul
git rm -r --cached backend/plugins/dev/triadix-ledger 2>nul

echo   Done. Plugins removed from tracking.

echo [2/6] Removing standalone projects from git...

git rm -r --cached neuralforge 2>nul
git rm -r --cached rddc-evolution 2>nul
git rm -r --cached agnt-auditor 2>nul
git rm -r --cached code-critic 2>nul
git rm -r --cached improve-AGNT 2>nul
git rm -r --cached _migration_from_broken_20260622_000453 2>nul
git rm -r --cached _plugin_investigation_20260622_011003 2>nul
git rm -r --cached _plugin_memory_restore_20260622_002555 2>nul
git rm -r --cached _publish 2>nul

echo   Done. Standalone projects removed from tracking.

echo [3/6] Removing other non-tracked files...

Remove-Item "C:\Users\jacks\OneDrive\Desktop\agnt-evo\WORKSPACE (SAVE)" -Force -ErrorAction SilentlyContinue
Remove-Item "C:\Users\jacks\OneDrive\Desktop\agnt-evo\dup.js" -Force -ErrorAction SilentlyContinue

echo   Done.

echo [4/6] Updating .gitignore...

C:\Users\jacks\OneDrive\Desktop\agnt-evo
$gitignoreContent = @"
# Dependencies
node_modules/
npm-cache
frontend/node_modules/
backend/node_modules/

# Plugin development (moved to AGNT-PLUGINS repo - https://github.com/jacksonjp0311-gif/AGNT-PLUGINS)
backend/plugins/dev/

# Plugin builds (generated during build, not stored in git)
backend/plugins/plugin-builds/
backend/plugins/dev/*/node_modules/

# Claude
.claude/

# AGNT
.agnt/

# Local git worktrees
.worktrees/

# Build outputs
dist/
out/
*.exe
*.dmg
*.AppImage
*.deb
*.rpm
*.zip
*.tar.gz

# Environment files
.env
.env.local
.env.production

# Keep example env file
!backend/.env.example

# Logs
logs/
_logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*

# OS files
.DS_Store
Thumbs.db
desktop.ini

# IDE files
.vscode/
.idea/
*.swp
*.swo
*~

# Temporary files
tmp/
temp/
*.tmp

# Frontend build
frontend/dist/
frontend/.vite/
frontend/.cache/

# Database files
*.db
*.db-shm
*.db-wal
*.sqlite
*.sqlite3
data/

# Package manager lock files
package-lock.json

# Claude
*.claude/

test-results/
backend/tests/providers/results/*.json

# MCP config (contains sensitive data)
*mcp.json

# Legacy migration artifacts
_migration_*
_plugin_investigation_*
_plugin_memory_restore_*
_publish
agnt-auditor
code-critic
improve-AGNT
rddc-evolution
neuralforge
"@

Set-Content -Path "C:\Users\jacks\OneDrive\Desktop\agnt-evo\.gitignore" -Value $gitignoreContent -NoNewline

echo   Done.

echo [5/6] Committing cleanup...

git add -A
git commit -m "chore: extract plugins and standalone projects to separate repos

Moved to https://github.com/jacksonjp0311-gif/AGNT-PLUGINS:
- aetherscop-afm, atlas-cloud, bankr-plugin, chat-actions-strip
- chemiframe, improve, neuralforge, operation-timer
- plaid-plugin, polymarket-plugin, triadix-governance, triadix-ledger

Removed standalone projects (already in own repos):
- neuralforge, rddc-evolution, agnt-auditor, code-critic, improve-AGNT

Cleaned up migration artifacts and workspace files."

echo   Done.

echo [6/6] Pushing cleanup...

git push origin main

echo   Done.

echo ============================================
echo  ALL CLEANUP COMPLETE
echo ============================================
echo.
echo Summary:
echo  - 12 plugins moved to AGNT-PLUGINS repo
echo  - 5 standalone projects removed
echo  - Migration artifacts cleaned
echo  - .gitignore updated
echo.
echo You still need to:
echo  1. Go to https://github.com/jacksonjp0311-gif/AGNT-PLUGINS
echo  2. Create the repository (if needed)
echo  3. cd AGNT-PLUGINS && git push -u origin main
echo ============================================
