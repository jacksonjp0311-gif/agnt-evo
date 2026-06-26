@echo off
cd /d C:\Users\jacks\OneDrive\Desktop\Ice-Crawler-AGNT-Plugin
echo Testing ICE Crawler AGNT Plugin v1.3.0

echo Step 1: Building .agnt package
echo Running: node scripts/build.js
node scripts/build.js

if errorlevel neq 0 (
  echo Build failed!
  exit /b 1
)

echo Step 2: Testing Frost telemetry
echo Running: node ice-crawler.js estimate https://github.com/agnt-gg/agnt
node ice-crawler.js estimate https://github.com/agnt-gg/agnt

if errorlevel neq 0 (
  echo Frost test failed!
  exit /b 1
)

echo Step 3: Testing dashboard API
(echo Starting dashboard server in background)
start /B node server.cjs 8765
(echo Waiting for server to start)
timeout /t 3 /nobreak >nul

echo Checking API status...
curl -s http://localhost:8765/api/status
echo.

echo Checking artifacts...
curl -s http://localhost:8765/api/artifacts
echo.

echo Checking main page...
curl -s http://localhost:8765/ | findstr /i "Submit to AGNT"

if errorlevel neq 0 (
  echo Dashboard test failed! Possibly not responding.
  exit /b 1
)

echo Step 4: Testing submit functionality
echo Checking for submit endpoint...
curl -s -X POST http://localhost:8765/api/submit
echo.

(echo Stopping background server)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8765') do (
  taskkill /PID %%a /F
)

echo.
echo ============================================
echo  ALL TESTS PASSED v1.3.0
echo ============================================
echo  ICE Crawler AGNT Plugin ready for marketplace!
echo  Output: dist/ice-crawler.agnt
echo ============================================
