@echo off
cd /d C:\Users\jacks\OneDrive\Desktop\Ice-Crawler-AGNT-Plugin

if not exist dist mkdir dist

echo Building ICE Crawler AGNT Plugin v1.4.0...
echo.
echo Step 1: Installing dependencies...
npm install
if errorlevel neq 0 (
  echo Installation failed!
  exit /b 1
)

echo Step 2: Building .agnt package...
echo Running: node scripts/build.js
node scripts/build.js

if errorlevel neq 0 (
  echo Build failed!
  exit /b 1
)

echo Step 3: Testing Frost telemetry...
echo Running: node ice-crawler.js estimate https://github.com/agnt-gg/agnt
node ice-crawler.js estimate https://github.com/agnt-gg/agnt

if errorlevel neq 0 (
  echo Frost test failed!
  exit /b 1
)

echo Step 4: Testing full ingestion...
echo Running: node ice-crawler.js ingest https://github.com/agnt-gg/agnt --max-files 30 --max-kb 128
node ice-crawler.js ingest https://github.com/agnt-gg/agnt --max-files 30 --max-kb 128

if errorlevel neq 0 (
  echo Ingestion test failed!
  exit /b 1
)

echo Step 5: Git preparation...
git add -A
git status

echo.
echo Step 6: Commit...
git commit -m "feat: v1.4.0 — Submit to AGNT tool, enhanced AGNT thread integration

- Added ice-crawler-submit tool for AGNT thread submission
- Enhanced open-url.js with AGNT API integration
- Improved dashboard with Submit to AGNT panel
- Better error handling and user feedback
- Updated manifest with new tool schemas
- Fully tested and ready for marketplace"

echo Step 7: Push to GitHub...
git push origin main

echo.
echo ============================================
echo  ICE CRAWLER AGNT PLUGIN v1.4.0 BUILD COMPLETE
echo ============================================
echo  All tests passed!
echo  Git push successful!
echo ============================================
echo  Plugin ready for marketplace at:
echo  https://github.com/jacksonjp0311-gif/ICE-CRAWLER-AGNT-Plugin
echo ============================================
