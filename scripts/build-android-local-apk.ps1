param(
    [string]$OutputPath = "public\downloads\school-system-android-beta-20260621-9a362b3.apk",
    [string]$BuildType = "debug"
)

$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$androidAssets = Join-Path $root "android\app\src\main\assets\public"
$resolvedOutputPath = Join-Path $root $OutputPath
$androidStudioJava = "C:\Program Files\Android\Android Studio\jbr"
if (Test-Path (Join-Path $androidStudioJava "bin\java.exe")) {
    $env:JAVA_HOME = $androidStudioJava
    $env:Path = (Join-Path $androidStudioJava "bin") + [IO.Path]::PathSeparator + $env:Path
}

Push-Location $root
try {
    npm run mobile:sync

    foreach ($name in @("downloads", "releases")) {
        $target = Join-Path $androidAssets $name
        Remove-Item -LiteralPath $target -Recurse -Force -ErrorAction SilentlyContinue
    }

    Push-Location (Join-Path $root "android")
    try {
        if ($BuildType -ieq "release") {
            .\gradlew.bat assembleRelease
            if ($LASTEXITCODE -ne 0) { throw "Gradle assembleRelease failed." }
            $apkPath = Join-Path $root "android\app\build\outputs\apk\release\app-release.apk"
        } else {
            .\gradlew.bat assembleDebug
            if ($LASTEXITCODE -ne 0) { throw "Gradle assembleDebug failed." }
            $apkPath = Join-Path $root "android\app\build\outputs\apk\debug\app-debug.apk"
        }
    } finally {
        Pop-Location
    }

    if (!(Test-Path $apkPath)) {
        throw "APK output not found: $apkPath"
    }

    New-Item -ItemType Directory -Path (Split-Path -Parent $resolvedOutputPath) -Force | Out-Null
    Copy-Item -LiteralPath $apkPath -Destination $resolvedOutputPath -Force
    $file = Get-Item -LiteralPath $resolvedOutputPath
    $sha = (Get-FileHash -LiteralPath $resolvedOutputPath -Algorithm SHA256).Hash.ToLowerInvariant()
    [pscustomobject]@{
        output = $file.FullName
        bytes = $file.Length
        sha256 = $sha
        buildType = $BuildType.ToLowerInvariant()
    } | ConvertTo-Json
} finally {
    Pop-Location
}
