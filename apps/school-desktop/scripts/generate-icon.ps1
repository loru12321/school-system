$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$appRoot = Split-Path -Parent $scriptDir
$repoRoot = [System.IO.Path]::GetFullPath((Join-Path $appRoot '..\..'))
$bundleDir = Join-Path $appRoot 'bundle'
$pngPath = Join-Path $bundleDir 'app-icon.png'
$icoPath = Join-Path $bundleDir 'app-icon.ico'

if (-not (Test-Path -LiteralPath $bundleDir)) {
    New-Item -ItemType Directory -Path $bundleDir | Out-Null
}

Add-Type -AssemblyName System.Drawing

$sourceCandidates = @(
    (Join-Path $repoRoot 'android\app\src\main\res\mipmap-xxxhdpi\ic_launcher.png'),
    (Join-Path $repoRoot 'android\app\src\main\res\mipmap-xxhdpi\ic_launcher.png'),
    (Join-Path $repoRoot 'android\app\src\main\res\mipmap-xhdpi\ic_launcher.png'),
    (Join-Path $repoRoot 'android\app\src\main\res\mipmap-hdpi\ic_launcher.png'),
    (Join-Path $repoRoot 'android\app\src\main\res\mipmap-mdpi\ic_launcher.png')
)

$sourceIconPath = $sourceCandidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
if (-not $sourceIconPath) {
    throw 'Android launcher icon not found. Expected ic_launcher.png under android/app/src/main/res/mipmap-*/.'
}

function New-ResizedBitmap {
    param(
        [System.Drawing.Image]$SourceImage,
        [int]$Size
    )

    $bitmap = New-Object System.Drawing.Bitmap($Size, $Size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $graphics.Clear([System.Drawing.Color]::Transparent)
    $graphics.DrawImage($SourceImage, 0, 0, $Size, $Size)
    $graphics.Dispose()
    return $bitmap
}

$baseImage = [System.Drawing.Image]::FromFile($sourceIconPath)
$pngBitmap = $null
$iconFrames = New-Object System.Collections.Generic.List[object]

try {
    $pngBitmap = New-ResizedBitmap -SourceImage $baseImage -Size 256
    $pngBitmap.Save($pngPath, [System.Drawing.Imaging.ImageFormat]::Png)

    $frameSizes = @(16, 20, 24, 32, 40, 48, 64, 72, 96, 128, 256)
    foreach ($size in $frameSizes) {
        $frameBitmap = New-ResizedBitmap -SourceImage $baseImage -Size $size
        $frameStream = New-Object System.IO.MemoryStream
        try {
            $frameBitmap.Save($frameStream, [System.Drawing.Imaging.ImageFormat]::Png)
            $iconFrames.Add([PSCustomObject]@{
                Size = $size
                Bytes = $frameStream.ToArray()
            })
        }
        finally {
            $frameStream.Dispose()
            $frameBitmap.Dispose()
        }
    }

    $memory = New-Object System.IO.MemoryStream
    $writer = New-Object System.IO.BinaryWriter($memory)
    try {
        $writer.Write([UInt16]0)
        $writer.Write([UInt16]1)
        $writer.Write([UInt16]$iconFrames.Count)

        $offset = 6 + ($iconFrames.Count * 16)
        foreach ($frame in $iconFrames) {
            $dimensionByte = if ($frame.Size -ge 256) { [byte]0 } else { [byte]$frame.Size }
            $writer.Write($dimensionByte)
            $writer.Write($dimensionByte)
            $writer.Write([byte]0)
            $writer.Write([byte]0)
            $writer.Write([UInt16]1)
            $writer.Write([UInt16]32)
            $writer.Write([UInt32]$frame.Bytes.Length)
            $writer.Write([UInt32]$offset)
            $offset += $frame.Bytes.Length
        }

        foreach ($frame in $iconFrames) {
            $writer.Write($frame.Bytes)
        }

        $writer.Flush()
        [System.IO.File]::WriteAllBytes($icoPath, $memory.ToArray())
    }
    finally {
        $writer.Dispose()
        $memory.Dispose()
    }
}
finally {
    if ($pngBitmap) {
        $pngBitmap.Dispose()
    }
    if ($baseImage) {
        $baseImage.Dispose()
    }
}

Write-Host "Desktop icon regenerated from Android launcher asset: $sourceIconPath"
