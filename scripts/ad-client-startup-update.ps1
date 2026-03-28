[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$ShareRoot,

    [string]$LocalRoot = 'C:\ProgramData\SchoolSystem',

    [int]$ShareWaitSeconds = 180,

    [switch]$Force,

    [switch]$SkipShortcut
)

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

function Resolve-NormalizedPath {
    param(
        [Parameter(Mandatory = $true)]
        [string]$PathValue
    )

    if ($PathValue -match '^[\\/]{2}') {
        return $PathValue.TrimEnd('\', '/')
    }

    return [System.IO.Path]::GetFullPath($PathValue).TrimEnd('\', '/')
}

function Ensure-Directory {
    param(
        [Parameter(Mandatory = $true)]
        [string]$PathValue
    )

    New-Item -ItemType Directory -Path $PathValue -Force | Out-Null
}

function Write-Log {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Message
    )

    $stamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    $line = "[$stamp] $Message"
    Add-Content -LiteralPath $script:LogPath -Value $line -Encoding UTF8
}

function Wait-ShareReady {
    param(
        [Parameter(Mandatory = $true)]
        [string]$PathValue,

        [Parameter(Mandatory = $true)]
        [int]$TimeoutSeconds
    )

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        if (Test-Path -LiteralPath $PathValue) {
            return $true
        }
        Start-Sleep -Seconds 5
    }
    return $false
}

function Read-JsonFile {
    param(
        [Parameter(Mandatory = $true)]
        [string]$PathValue
    )

    return Get-Content -LiteralPath $PathValue -Raw -Encoding UTF8 | ConvertFrom-Json
}

function Invoke-RobocopyMirror {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Source,

        [Parameter(Mandatory = $true)]
        [string]$Destination
    )

    Ensure-Directory $Destination
    $quotedSource = '"' + $Source + '"'
    $quotedDestination = '"' + $Destination + '"'
    $robocopyCommand = "robocopy $quotedSource $quotedDestination *.* /MIR /R:2 /W:3 /Z /FFT /NFL /NDL /NP"
    cmd /c $robocopyCommand | Out-Null

    if ($LASTEXITCODE -ge 8) {
        throw "robocopy failed with exit code $LASTEXITCODE"
    }
}

function Ensure-Shortcut {
    param(
        [Parameter(Mandatory = $true)]
        [string]$TargetPath,

        [Parameter(Mandatory = $true)]
        [string]$IconPath
    )

    $desktopPath = [Environment]::GetFolderPath('CommonDesktopDirectory')
    $shortcutPath = Join-Path $desktopPath 'School System.lnk'
    $shell = New-Object -ComObject WScript.Shell
    $shortcut = $shell.CreateShortcut($shortcutPath)
    $shortcut.TargetPath = $TargetPath
    $shortcut.WorkingDirectory = Split-Path -Path $TargetPath -Parent
    if (Test-Path -LiteralPath $IconPath) {
        $shortcut.IconLocation = $IconPath
    }
    $shortcut.Description = 'School System launcher'
    $shortcut.Save()
}

$ShareRoot = Resolve-NormalizedPath $ShareRoot
$LocalRoot = Resolve-NormalizedPath $LocalRoot
$AppRoot = Join-Path $LocalRoot 'app'
$LogRoot = Join-Path $LocalRoot 'logs'
$LogPath = Join-Path $LogRoot 'startup-update.log'
$CurrentShareRoot = Join-Path $ShareRoot 'current'
$RemoteReleaseJson = Join-Path $CurrentShareRoot 'release.json'
$LocalReleaseJson = Join-Path $AppRoot 'release.json'
$LauncherPath = Join-Path $AppRoot 'Open School System.cmd'
$IconPath = Join-Path $AppRoot 'favicon.ico'

Ensure-Directory $LocalRoot
Ensure-Directory $LogRoot

Write-Log "Startup update begin."
Write-Log "Share root: $ShareRoot"
Write-Log "Local root: $LocalRoot"

if (-not (Wait-ShareReady -PathValue $RemoteReleaseJson -TimeoutSeconds $ShareWaitSeconds)) {
    Write-Log "Share did not become ready within $ShareWaitSeconds seconds. Update skipped."
    exit 0
}

$remoteRelease = Read-JsonFile $RemoteReleaseJson
$remoteVersion = [string]$remoteRelease.version
$entryFile = [string]$remoteRelease.entry_file

if ([string]::IsNullOrWhiteSpace($remoteVersion)) {
    throw "Remote release.json does not contain version."
}

if ([string]::IsNullOrWhiteSpace($entryFile)) {
    throw "Remote release.json does not contain entry_file."
}

$needsUpdate = $Force.IsPresent

if (-not $needsUpdate) {
    if (-not (Test-Path -LiteralPath $LocalReleaseJson)) {
        $needsUpdate = $true
    } else {
        $localRelease = Read-JsonFile $LocalReleaseJson
        $localVersion = [string]$localRelease.version
        $localEntry = Join-Path $AppRoot $entryFile

        if ($localVersion -ne $remoteVersion) {
            $needsUpdate = $true
        } elseif (-not (Test-Path -LiteralPath $localEntry)) {
            $needsUpdate = $true
        }
    }
}

if ($needsUpdate) {
    Write-Log "Updating client to version $remoteVersion."
    Invoke-RobocopyMirror -Source $CurrentShareRoot -Destination $AppRoot
    Write-Log "File sync completed."
} else {
    Write-Log "Client already on version $remoteVersion."
}

if (-not $SkipShortcut) {
    if (Test-Path -LiteralPath $LauncherPath) {
        Ensure-Shortcut -TargetPath $LauncherPath -IconPath $IconPath
        Write-Log "Desktop shortcut ensured."
    } else {
        Write-Log "Launcher not found, desktop shortcut skipped."
    }
}

Write-Log "Startup update finished."
exit 0
