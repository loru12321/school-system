$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$appRoot = Split-Path -Parent $scriptDir
$bundleDir = Join-Path $appRoot 'bundle'
$pngPath = Join-Path $bundleDir 'app-icon.png'
$icoPath = Join-Path $bundleDir 'app-icon.ico'

if (-not (Test-Path -LiteralPath $bundleDir)) {
    New-Item -ItemType Directory -Path $bundleDir | Out-Null
}

Add-Type -AssemblyName System.Drawing

$size = 256
$bitmap = New-Object System.Drawing.Bitmap($size, $size)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
$graphics.Clear([System.Drawing.Color]::FromArgb(16, 39, 86))

$rect = New-Object System.Drawing.Rectangle(0, 0, $size, $size)
$bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    $rect,
    [System.Drawing.Color]::FromArgb(34, 89, 210),
    [System.Drawing.Color]::FromArgb(22, 166, 221),
    135
)
$graphics.FillRectangle($bgBrush, $rect)

$glowBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(72, 255, 255, 255))
$graphics.FillEllipse($glowBrush, 28, 24, 164, 164)
$graphics.FillEllipse($glowBrush, 148, 158, 84, 84)

$cardRect = New-Object System.Drawing.RectangleF(22, 22, 212, 212)
$path = New-Object System.Drawing.Drawing2D.GraphicsPath
$radius = 54
$diameter = $radius * 2
$path.AddArc($cardRect.X, $cardRect.Y, $diameter, $diameter, 180, 90)
$path.AddArc($cardRect.Right - $diameter, $cardRect.Y, $diameter, $diameter, 270, 90)
$path.AddArc($cardRect.Right - $diameter, $cardRect.Bottom - $diameter, $diameter, $diameter, 0, 90)
$path.AddArc($cardRect.X, $cardRect.Bottom - $diameter, $diameter, $diameter, 90, 90)
$path.CloseFigure()

$panelBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    [System.Drawing.Rectangle]::Round($cardRect),
    [System.Drawing.Color]::FromArgb(232, 255, 255, 255),
    [System.Drawing.Color]::FromArgb(208, 230, 242, 255),
    135
)
$graphics.FillPath($panelBrush, $path)

$panelBorder = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(112, 255, 255, 255), 3)
$graphics.DrawPath($panelBorder, $path)

$accentPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(56, 89, 214), 16)
$accentPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
$accentPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
$graphics.DrawLine($accentPen, 88, 92, 168, 92)
$graphics.DrawLine($accentPen, 88, 128, 152, 128)
$graphics.DrawLine($accentPen, 88, 164, 168, 164)

$badgeBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(28, 126, 255))
$graphics.FillEllipse($badgeBrush, 154, 150, 46, 46)

$textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(245, 255, 255, 255))
$titleFont = New-Object System.Drawing.Font('Segoe UI', 46, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$format = New-Object System.Drawing.StringFormat
$format.Alignment = [System.Drawing.StringAlignment]::Center
$format.LineAlignment = [System.Drawing.StringAlignment]::Center
$graphics.DrawString('SE', $titleFont, $textBrush, [System.Drawing.RectangleF]::new(44, 34, 132, 76), $format)

$subtitleFont = New-Object System.Drawing.Font('Segoe UI', 18, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$subtitleBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(36, 72, 170))
$graphics.DrawString('OS', $subtitleFont, $subtitleBrush, [System.Drawing.RectangleF]::new(150, 150, 52, 46), $format)

$bitmap.Save($pngPath, [System.Drawing.Imaging.ImageFormat]::Png)

$pngBytes = [System.IO.File]::ReadAllBytes($pngPath)
$memory = New-Object System.IO.MemoryStream
$writer = New-Object System.IO.BinaryWriter($memory)
$writer.Write([UInt16]0)
$writer.Write([UInt16]1)
$writer.Write([UInt16]1)
$writer.Write([Byte]0)
$writer.Write([Byte]0)
$writer.Write([Byte]0)
$writer.Write([Byte]0)
$writer.Write([UInt16]1)
$writer.Write([UInt16]32)
$writer.Write([UInt32]$pngBytes.Length)
$writer.Write([UInt32]22)
$writer.Write($pngBytes)
$writer.Flush()
[System.IO.File]::WriteAllBytes($icoPath, $memory.ToArray())

$writer.Dispose()
$memory.Dispose()
$subtitleBrush.Dispose()
$subtitleFont.Dispose()
$format.Dispose()
$titleFont.Dispose()
$textBrush.Dispose()
$badgeBrush.Dispose()
$accentPen.Dispose()
$panelBorder.Dispose()
$panelBrush.Dispose()
$path.Dispose()
$glowBrush.Dispose()
$bgBrush.Dispose()
$graphics.Dispose()
$bitmap.Dispose()

Write-Host "Desktop icon generated at $icoPath"
