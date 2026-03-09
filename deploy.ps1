# GitHub Automation Script
git add .
$status = git status --porcelain
if ($status) {
    git commit -m "update: automatic build and synchronization [$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')]"
    git push
    Write-Host "✅ Changes pushed to GitHub successfully." -ForegroundColor Green
} else {
    Write-Host "ℹ️ No changes to commit." -ForegroundColor Cyan
}
