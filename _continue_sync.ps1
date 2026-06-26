Set-Location "C:\Users\jacks\OneDrive\Desktop\agnt-evo"
Write-Host "=== AGNT-EVO PULL ==="
git pull origin main
Write-Host "Latest:"
git log --oneline -1
Write-Host ""
Write-Host "=== SYNC NEURALFORGE TO COLD STORAGE ==="
$nfSrc = "C:\Users\jacks\OneDrive\Desktop\agnt-evo\backend\plugins\dev\neuralforge"
$nfDst = "C:\Users\jacks\OneDrive\Desktop\AGNT-PLUGINS\src\neuralforge"
if (Test-Path $nfSrc) {
    Write-Host "neuralforge in agnt-evo: EXISTS"
    Copy-Item -Path $nfSrc\ -Destination $nfDst\ -Recurse -Force
    Write-Host "Copied to AGNT-PLUGINS"
} else {
    Write-Host "neuralforge NOT in agnt-evo"
}
Write-Host ""
Write-Host "=== COLD STORAGE STATUS ==="
Set-Location "C:\Users\jacks\OneDrive\Desktop\AGNT-PLUGINS"
$count = (Get-ChildItem src\ -Directory).Count
Write-Host "Plugins in cold storage: $count"
Write-Host "Latest:"
git log --oneline -1
