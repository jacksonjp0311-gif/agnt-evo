@echo off
cd /d C:\Users\jacks\OneDrive\Desktop\Ice-Crawler-AGNT-Plugin
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8765') do taskkill /PID %%a /F 2>nul
timeout /t 2 /nobreak >nul
start /B node server.cjs 8765
timeout /t 4 /nobreak >nul
echo === STATUS ===
curl -s http://localhost:8765/api/status
echo.
echo === ARTIFACTS ===
curl -s http://localhost:8765/api/artifacts
echo.
echo === SUBMIT (no run) ===
curl -s -X POST http://localhost:8765/api/submit -H "Content-Type: application/json" -d "{}"
echo.
echo === HTML Submit button ===
curl -s http://localhost:8765/ | findstr /C:"Submit to AGNT"
echo.
echo === HTML submitToAgnt ===
curl -s http://localhost:8765/ | findstr /C:"submitToAgnt"
echo.
echo === HTML Open AGNT Chat ===
curl -s http://localhost:8765/ | findstr /C:"Open AGNT Chat"
echo.
echo === DONE ===
