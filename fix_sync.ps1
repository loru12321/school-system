$file = 'c:\Users\loru\Desktop\system\lt.html'
$content = [System.IO.File]::ReadAllText($file)
$old = 'if (res.success && res.count > 0) {'
$new = 'if (res.success) {'
$content = $content.Replace($old, $new)
[System.IO.File]::WriteAllText($file, $content)
Write-Host "lt.html fixed: replaced all occurrences of res.count > 0 gating"

$file2 = 'c:\Users\loru\Desktop\system\public\assets\js\app.js'
$content2 = [System.IO.File]::ReadAllText($file2)
$content2 = $content2.Replace($old, $new)
[System.IO.File]::WriteAllText($file2, $content2)
Write-Host "app.js fixed: replaced all occurrences of res.count > 0 gating"
