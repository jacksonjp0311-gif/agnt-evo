@echo off
cd /d C:\Users\jacks\OneDrive\Desktop\Ice-Crawler-AGNT-Plugin

echo Step 1: Kill any existing server on 8765
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8765') do taskkill /PID %%a /F 2>nul
timeout /t 1 /nobreak >nul

echo Step 2: Start server in background
start /B "" node server.cjs 8765
timeout /t 3 /nobreak >nul

echo Step 3: Test status endpoint
curl -s http://localhost:8765/api/status
echo.

echo Step 4: Test HTML has Submit button
curl -s http://localhost:8765/ | findstr /i "Submit to AGNT"
echo.

echo Step 5: Test HTML has submitToAgnt function
curl -s http://localhost:8765/ | findstr /i "submitToAgnt"
echo.

echo Step 6: Test HTML has openAgntChat function
curl -s http://localhost:8765/ | findstr /i "openAgntChat"
echo.

echo Step 7: Test HTML has auto-open
curl -s http://localhost:8765/ | findstr /i "Auto-open"
echo.
echo.
echo === ALL TESTS DONE ===
