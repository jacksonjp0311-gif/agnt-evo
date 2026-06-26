@echo off
cd /d C:\Users\jacks\OneDrive\Desktop\agnt-evo
echo === SYNC AGNT-EVO ===
git status --porcelain
git pull origin main
echo === STATUS ===
echo Done.
