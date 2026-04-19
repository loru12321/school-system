# One-click Git sync script for the school-system repository.
param(
    [string]$Message = ""
)

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Set-Location $PSScriptRoot

$trackedUpdatePaths = @(
    ".gitignore",
    "src",
    "public",
    "apps",
    "docs",
    "supabase",
    "scripts",
    "deploy.ps1",
    "README.md",
    "package.json",
    "package-lock.json",
    "vite.config.js",
    "lt.html",
    "dist"
)

$explicitStagePaths = @(
    ".gitignore",
    "src",
    "public",
    "apps",
    "docs",
    "supabase",
    "scripts",
    "deploy.ps1",
    "README.md",
    "package.json",
    "package-lock.json",
    "vite.config.js",
    "lt.html"
)

git add -u -- $trackedUpdatePaths
git add -- $explicitStagePaths

if (Test-Path "dist") {
    git add -f -- dist/index.html
    if (Test-Path "dist/assets") {
        git add -f -- dist/assets
    }
}

$status = git status --porcelain

if (-not $status) {
    Write-Host "No changes to commit." -ForegroundColor Cyan
    exit 0
}

if ([string]::IsNullOrWhiteSpace($Message)) {
    $Message = "update: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
}

git commit -m $Message
git push origin main

Write-Host "Changes committed and pushed to GitHub." -ForegroundColor Green
