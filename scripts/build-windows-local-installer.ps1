param(
    [string]$OutputPath = "public\downloads\school-system-windows-beta-20260624-7e19d7d.exe"
)

$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$distDir = Join-Path $root "dist"
$buildDir = Join-Path $root ".tmp-windows-local-installer"
$bundleDir = Join-Path $buildDir "app"
$clientExe = Join-Path $buildDir "school-system-client.exe"
$appZip = Join-Path $buildDir "school-system-app.zip"
$resolvedOutputPath = Join-Path $root $OutputPath
$csc = "$env:WINDIR\Microsoft.NET\Framework64\v4.0.30319\csc.exe"

if (!(Test-Path $csc)) {
    $csc = "$env:WINDIR\Microsoft.NET\Framework\v4.0.30319\csc.exe"
}
if (!(Test-Path $csc)) {
    throw "Unable to find csc.exe for building the Windows local installer."
}
if (!(Test-Path (Join-Path $distDir "index.html"))) {
    throw "dist/index.html does not exist. Run npm run build first."
}

Remove-Item -LiteralPath $buildDir -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $bundleDir | Out-Null

Get-ChildItem -LiteralPath $distDir -Force | Where-Object {
    $_.Name -ne "downloads" -and $_.Name -ne "releases"
} | ForEach-Object {
    Copy-Item -LiteralPath $_.FullName -Destination $bundleDir -Recurse -Force
}

Compress-Archive -Path (Join-Path $bundleDir "*") -DestinationPath $appZip -Force

$clientArgs = @(
    "/nologo",
    "/target:winexe",
    "/platform:x64",
    "/out:$clientExe",
    "/reference:System.dll",
    "/reference:System.Windows.Forms.dll",
    "/reference:System.Drawing.dll",
    (Join-Path $root "desktop\windows-client\SchoolSystemClient.cs")
)
& $csc @clientArgs
if ($LASTEXITCODE -ne 0) {
    throw "Failed to build Windows client launcher."
}

New-Item -ItemType Directory -Path (Split-Path -Parent $resolvedOutputPath) -Force | Out-Null
$installerArgs = @(
    "/nologo",
    "/target:winexe",
    "/platform:x64",
    "/out:$resolvedOutputPath",
    "/reference:System.dll",
    "/reference:System.Windows.Forms.dll",
    "/reference:System.Drawing.dll",
    "/reference:System.IO.Compression.dll",
    "/reference:System.IO.Compression.FileSystem.dll",
    "/resource:$clientExe,school-system-client.exe",
    "/resource:$appZip,school-system-app.zip",
    (Join-Path $root "desktop\windows-client\SchoolSystemInstaller.cs")
)
& $csc @installerArgs
if ($LASTEXITCODE -ne 0) {
    throw "Failed to build Windows local installer."
}

$file = Get-Item -LiteralPath $resolvedOutputPath
$sha = (Get-FileHash -LiteralPath $resolvedOutputPath -Algorithm SHA256).Hash.ToLowerInvariant()
[pscustomobject]@{
    output = $file.FullName
    bytes = $file.Length
    sha256 = $sha
    bundledAppBytes = (Get-Item -LiteralPath $appZip).Length
} | ConvertTo-Json
