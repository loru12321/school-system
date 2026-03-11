# One-click Git sync script for the school-system repository.
param(
    [string]$Message = "",
    [switch]$ForceRemote
)

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Set-Location $PSScriptRoot

git add -A
$status = git status --porcelain

if (-not $status) {
    Write-Host "No changes to commit." -ForegroundColor Cyan
    exit 0
}

if ([string]::IsNullOrWhiteSpace($Message)) {
    $Message = "update: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
}

git commit -m $Message

if ($ForceRemote) {
    git push --force-with-lease origin main
    Write-Host "Changes committed and force-pushed to GitHub." -ForegroundColor Yellow
} else {
    git push origin main
    Write-Host "Changes committed and pushed to GitHub." -ForegroundColor Green
}
