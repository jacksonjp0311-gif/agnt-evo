$ErrorActionPreference = "Continue"

$repos = @(
    @{name="agnt-evo"; path="C:\Users\jacks\OneDrive\Desktop\agnt-evo"},
    @{name="AGNT-PLUGINS"; path="C:\Users\jacks\OneDrive\Desktop\AGNT-PLUGINS"},
    @{name="Tessera"; path="C:\Users\jacks\OneDrive\Desktop\Tessera"}
)

foreach ($r in $repos) {
    Write-Host "=== $($r.name) ==="
    Set-Location $r.path

    # 1. Set git config
    git config user.email "jacksonjp0311@gmail.com"
    git config user.name "jacksonjp0311"

    # 2. Pull if behind
    $behind = git rev-list HEAD..origin/main --count 2>$null
    if ($behind -ne "0") {
        Write-Host "  Pulling $behind commits..."
        git pull origin main
    }

    # 3. Check dirty
    $dirty = git status --porcelain
    if ($dirty) {
        Write-Host "  Dirty files: $($dirty.Count)"
        git add -A
        git commit -m "chore: sync local changes"
        git push origin main
        Write-Host "  Committed and pushed."
    } else {
        Write-Host "  Clean."
    }
    Write-Host ""
}

Write-Host "=== VER ($r in $repos) {
    Set-Location $r.path
    $behind = git rev-list HEAD..origin/main --count 2>$null
    $dirty = git status --porcelain
    $status = ($behind -eq "0" -and -not $dirty) ? "OK" : "ISSUE"
    Write-Host "  $status  $($r.name) (behind=$behind, dirty=$($dirty.Count))"
}
