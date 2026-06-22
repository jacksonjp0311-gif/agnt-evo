$ErrorActionPreference = "Stop"

$RepoRoot = "C:\Users\jacks\OneDrive\Desktop\agnt-evo"
$Frontend = Join-Path $RepoRoot "frontend"

Write-Host ""
Write-Host "AGNT Local" -ForegroundColor Cyan
Write-Host "Repo: $RepoRoot" -ForegroundColor White

if (Test-Path $Frontend) {
    Start-Process powershell.exe -ArgumentList @(
        "-NoExit",
        "-ExecutionPolicy", "Bypass",
        "-Command",
        "cd `"$Frontend`"; Write-Host 'AGNT LOCAL FRONTEND' -ForegroundColor Cyan; npm install; npm run dev"
    )
}

Start-Sleep -Seconds 2

Start-Process powershell.exe -ArgumentList @(
    "-NoExit",
    "-ExecutionPolicy", "Bypass",
    "-Command",
    "cd `"$RepoRoot`"; Write-Host 'AGNT LOCAL BACKEND' -ForegroundColor Cyan; npm install; npm run dev"
)

Start-Process "http://localhost:5173/"
