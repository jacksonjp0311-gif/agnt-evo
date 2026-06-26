@echo off
set SOURCE=C:\Users\jacks\OneDrive\Desktop\agnt-evo\backend\plugins\dev\improve
set TARGET=C:\Users\jacks\AppData\Roaming\AGNT\plugins\installed\improve

echo Installing improve plugin...
if not exist "%TARGET%" mkdir "%TARGET%"
if not exist "%TARGET%\tools" mkdir "%TARGET%\tools"

copy "%SOURCE%\manifest.json" "%TARGET%\manifest.json"
copy "%SOURCE%\package.json" "%TARGET%\package.json"
copy "%SOURCE%\tools\improve-audit.js" "%TARGET%\tools\improve-audit.js"
copy "%SOURCE%\tools\improve-plan.js" "%TARGET%\tools\improve-plan.js"
copy "%SOURCE%\tools\improve-reconcile.js" "%TARGET%\tools\improve-reconcile.js"
copy "%SOURCE%\tools\improve-review-plan.js" "%TARGET%\tools\improve-review-plan.js"
copy "%SOURCE%\tools\improve-branch-audit.js" "%TARGET%\tools\improve-branch-audit.js"

echo Done! Installed to %TARGET%
dir "%TARGET%"
