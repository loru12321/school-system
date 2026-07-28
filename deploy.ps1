# One-click Git sync script for the school-system repository.
param(
    [string]$Message = ""
)

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Set-Location $PSScriptRoot

# 只列实际存在的路径。曾经这里写着已不存在的 "apps"，git add 会以
# "fatal: pathspec 'apps' did not match any files" 整条命令失败 —— 而
# $ErrorActionPreference="Stop" 管不住原生命令的退出码，脚本会继续往下
# commit + push，造成「dist 产物已提交、源码/测试没提交」的半成品发布。
# 因此下面既做存在性过滤，也对每条 git 命令显式检查 $LASTEXITCODE。
$sourcePaths = @(
    ".gitignore",
    "src",
    "public",
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

function Invoke-Git {
    param([Parameter(Mandatory = $true)][string[]]$Arguments)
    & git @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "git $($Arguments -join ' ') failed with exit code $LASTEXITCODE"
    }
}

# 新增路径要挡住：漏了会静默少发布一整个目录。
$missingPaths = @($sourcePaths | Where-Object { -not (Test-Path $_) })
if ($missingPaths.Count -gt 0) {
    throw "deploy path list is stale, these paths do not exist: $($missingPaths -join ', ')"
}

# `git add -u -- <path>` 在该路径下尚无跟踪文件时会以 128 退出（dist/ 被 ignore
# 时尤其容易撞上），所以先问 git 哪些路径真的有跟踪内容，只对这些跑 -u。
$trackedUpdatePaths = @(@($sourcePaths) + @("dist") | Where-Object {
    $probe = & git ls-files -- $_
    if ($LASTEXITCODE -ne 0) { throw "git ls-files -- $_ failed with exit code $LASTEXITCODE" }
    -not [string]::IsNullOrWhiteSpace($probe)
})

if ($trackedUpdatePaths.Count -gt 0) {
    Invoke-Git (@("add", "-u", "--") + $trackedUpdatePaths)
}
Invoke-Git (@("add", "--") + $sourcePaths)

# dist/ 在 .gitignore 里，所以必须 -f。sw.js 每次构建都会换内容版本号，
# 漏了它会让线上 service worker 指向不存在的哈希产物。
if (Test-Path "dist") {
    Invoke-Git @("add", "-f", "--", "dist/index.html")
    if (Test-Path "dist/sw.js") {
        Invoke-Git @("add", "-f", "--", "dist/sw.js")
    }
    if (Test-Path "dist/assets") {
        Invoke-Git @("add", "-f", "--", "dist/assets")
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

Invoke-Git @("commit", "-m", $Message)
Invoke-Git @("push", "origin", "main")

Write-Host "Changes committed and pushed to GitHub." -ForegroundColor Green
