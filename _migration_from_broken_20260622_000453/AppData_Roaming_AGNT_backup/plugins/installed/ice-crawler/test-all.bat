@echo off
cd /d C:\Users\jacks\OneDrive\Desktop\Ice-Crawler-AGNT-Plugin

echo Step 1: Kill any existing server on 8765
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8765') do taskkill /PID %%a /F 2>nul
timeout /t 2 /nobreak >nul

echo Step 2: Start server in background
start /B node server.cjs 8765
timeout /t 3 /nobreak >nul

echo Step 3: Test endpoints
echo --- /api/status ---
curl -s http://localhost:8765/api/status
echo.
echo --- /api/artifacts ---
curl -s http://localhost:8765/api/artifacts
echo.
echo --- /api/submit (no run) ---
curl -s -X POST http://localhost:8765/api/submit -H "Content-Type: application/json" -d "{}"
echo.
echo --- HTML check ---
curl -s http://localhost:8765/ | findstr /i "Submit to AGNT"
echo.
echo --- HTML submitToAgnt ---
curl -s http://localhost:8765/ | findstr /i "submitToAgnt"
echo.
echo --- HTML AGNT Chat ---
curl -s http://localhost:8765/ | findstr /i "Open AGNT Chat"
echo.
echo === DONE ===
