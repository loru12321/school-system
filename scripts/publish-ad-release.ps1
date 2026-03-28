[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$ShareRoot,

    [string]$Version = "",

    [string]$ProjectRoot = "",

    [string]$Channel = "production",

    [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

function Resolve-FullPath {
    param(
        [Parameter(Mandatory = $true)]
        [string]$PathValue
    )

    if ($PathValue -match '^[\\/]{2}') {
        return $PathValue.TrimEnd('\', '/')
    }

    return [System.IO.Path]::GetFullPath($PathValue).TrimEnd('\', '/')
}

function Copy-DirectoryContent {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Source,

        [Parameter(Mandatory = $true)]
        [string]$Destination
    )

    if (-not (Test-Path -LiteralPath $Source)) {
        throw "Source directory not found: $Source"
    }

    New-Item -ItemType Directory -Path $Destination -Force | Out-Null
    Get-ChildItem -LiteralPath $Source -Force | ForEach-Object {
        Copy-Item -LiteralPath $_.FullName -Destination $Destination -Recurse -Force
    }
}

if ([string]::IsNullOrWhiteSpace($ProjectRoot)) {
    $ProjectRoot = Resolve-FullPath (Join-Path $PSScriptRoot '..')
} else {
    $ProjectRoot = Resolve-FullPath $ProjectRoot
}

$ShareRoot = Resolve-FullPath $ShareRoot
$ltHtmlPath = Join-Path $ProjectRoot 'lt.html'
$faviconPath = Join-Path $ProjectRoot 'public\favicon.ico'
$tablerIconsPath = Join-Path $ProjectRoot 'public\assets\vendor\tabler-icons'
$clientScriptPath = Join-Path $ProjectRoot 'scripts\ad-client-startup-update.ps1'

if (-not (Test-Path -LiteralPath $ltHtmlPath)) {
    throw "lt.html not found. Build the project first or omit -SkipBuild: $ltHtmlPath"
}

if (-not (Test-Path -LiteralPath $faviconPath)) {
    throw "favicon not found: $faviconPath"
}

if (-not (Test-Path -LiteralPath $tablerIconsPath)) {
    throw "tabler-icons folder not found: $tablerIconsPath"
}

if (-not (Test-Path -LiteralPath $clientScriptPath)) {
    throw "Client startup update script not found: $clientScriptPath"
}

if (-not $SkipBuild) {
    Push-Location $ProjectRoot
    try {
        cmd /c npm run build
        if ($LASTEXITCODE -ne 0) {
            throw "npm run build failed with exit code $LASTEXITCODE"
        }
    } finally {
        Pop-Location
    }
}

$gitSha = ""
try {
    Push-Location $ProjectRoot
    try {
        $gitSha = (git rev-parse --short HEAD 2>$null).Trim()
    } finally {
        Pop-Location
    }
} catch {
    $gitSha = ""
}

if ([string]::IsNullOrWhiteSpace($Version)) {
    $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
    if ([string]::IsNullOrWhiteSpace($gitSha)) {
        $Version = $stamp
    } else {
        $Version = "$stamp-$gitSha"
    }
}

$releasesRoot = Join-Path $ShareRoot 'releases'
$currentRoot = Join-Path $ShareRoot 'current'
$scriptsRoot = Join-Path $ShareRoot 'scripts'
$versionRoot = Join-Path $releasesRoot $Version
$packageRoot = Join-Path $versionRoot 'package'
$packageVendorRoot = Join-Path $packageRoot 'public\assets\vendor'
$releaseJsonPath = Join-Path $packageRoot 'release.json'
$launcherPath = Join-Path $packageRoot 'Open School System.cmd'

New-Item -ItemType Directory -Path $releasesRoot -Force | Out-Null
New-Item -ItemType Directory -Path $scriptsRoot -Force | Out-Null

if (Test-Path -LiteralPath $versionRoot) {
    throw "Release version already exists on share: $versionRoot"
}

New-Item -ItemType Directory -Path $packageVendorRoot -Force | Out-Null

Copy-Item -LiteralPath $ltHtmlPath -Destination (Join-Path $packageRoot 'lt.html') -Force
Copy-Item -LiteralPath $faviconPath -Destination (Join-Path $packageRoot 'favicon.ico') -Force
Copy-DirectoryContent -Source $tablerIconsPath -Destination (Join-Path $packageVendorRoot 'tabler-icons')

$launcherContent = @'
@echo off
setlocal
set "APP_HTML=%~dp0lt.html"

if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" "%APP_HTML%"
    exit /b 0
)

if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" "%APP_HTML%"
    exit /b 0
)

if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" "%APP_HTML%"
    exit /b 0
)

if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" "%APP_HTML%"
    exit /b 0
)

start "" "%APP_HTML%"
'@
Set-Content -LiteralPath $launcherPath -Value $launcherContent -Encoding ASCII

$ltHtmlHash = (Get-FileHash -LiteralPath $ltHtmlPath -Algorithm SHA256).Hash

$releaseMetadata = [ordered]@{
    app_name = 'school-system'
    channel = $Channel
    version = $Version
    published_at = (Get-Date).ToString('s')
    published_by = $env:USERNAME
    source_commit = $gitSha
    entry_file = 'lt.html'
    launcher_file = 'Open School System.cmd'
    package_mode = 'single-file-plus-vendor'
    package_relative_paths = @(
        'lt.html'
        'favicon.ico'
        'Open School System.cmd'
        'public/assets/vendor/tabler-icons'
    )
    sha256 = [ordered]@{
        lt_html = $ltHtmlHash
    }
}

$releaseMetadata | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $releaseJsonPath -Encoding UTF8

Copy-Item -LiteralPath $clientScriptPath -Destination (Join-Path $scriptsRoot 'ad-client-startup-update.ps1') -Force

if (Test-Path -LiteralPath $currentRoot) {
    Remove-Item -LiteralPath $currentRoot -Recurse -Force
}

Copy-Item -LiteralPath $packageRoot -Destination $currentRoot -Recurse -Force

Write-Host "AD release published successfully." -ForegroundColor Green
Write-Host "Share root: $ShareRoot"
Write-Host "Current package: $currentRoot"
Write-Host "Version archive: $versionRoot"
Write-Host "Version: $Version"
