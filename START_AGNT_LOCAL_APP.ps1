$ErrorActionPreference = "Stop"

$RepoRoot = "C:\Users\jacks\OneDrive\Desktop\agnt-evo"
Set-Location $RepoRoot

Write-Host ""
Write-Host "AGNT Local App" -ForegroundColor Cyan
Write-Host "Repo: $RepoRoot" -ForegroundColor White
Write-Host "Launch: npm run start" -ForegroundColor White
Write-Host ""

# Stop old browser/dev frontend-only loops, but do not kill this launcher.
$currentPid = $PID

Get-CimInstance Win32_Process | Where-Object {
    $_.ProcessId -ne $currentPid -and
    $_.CommandLine -and
    (
        $_.CommandLine -like "*AGNT LOCAL FRONTEND*" -or
        $_.CommandLine -like "*AGNT CLEAN FRONTEND*" -or
        $_.CommandLine -like "*vite*localhost*" -or
        $_.CommandLine -like "*START_AGNT_LOCAL.ps1*"
    ) -and
    ($_.Name -match "node|npm|powershell|cmd")
} | ForEach-Object {
    try {
        Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
    } catch {}
}

npm run start
