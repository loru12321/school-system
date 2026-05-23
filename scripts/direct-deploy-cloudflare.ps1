[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
Add-Type -AssemblyName System.Net.Http

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$distDir = Join-Path $root 'dist'
$srcDir = Join-Path $root 'src'
$wranglerConfigPath = Join-Path $root 'wrangler.jsonc'
$wranglerAuthPath = if ($env:WRANGLER_CONFIG_PATH) {
  $env:WRANGLER_CONFIG_PATH
} else {
  Join-Path $env:APPDATA 'xdg.config\.wrangler\config\default.toml'
}
$tmpDir = Join-Path $root '.tmp-cf-direct'
$proxy = 'http://127.0.0.1:7897'
$accountId = 'af1077850d5b820c28d2425c5208b761'
$wranglerClientId = '54d11594-84e4-41aa-b438-e81b8fa78ee7'
$wranglerTokenUrl = 'https://dash.cloudflare.com/oauth2/token'

function Ensure-Directory {
  param([string]$Path)
  if (-not (Test-Path $Path)) {
    New-Item -ItemType Directory -Path $Path | Out-Null
  }
}

function Write-Utf8NoBomFile {
  param(
    [string]$Path,
    [string]$Content
  )
  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($Path, $Content, $utf8NoBom)
}

function Read-WranglerAuthContext {
  $raw = Get-Content $wranglerAuthPath -Raw
  $tokenMatch = [regex]::Match($raw, 'oauth_token\s*=\s*"([^"]+)"')
  $refreshMatch = [regex]::Match($raw, 'refresh_token\s*=\s*"([^"]+)"')
  $expiryMatch = [regex]::Match($raw, 'expiration_time\s*=\s*"([^"]+)"')
  if (-not $tokenMatch.Success) {
    throw 'Unable to find Wrangler oauth_token.'
  }
  return [ordered]@{
    Raw = $raw
    AccessToken = $tokenMatch.Groups[1].Value
    RefreshToken = if ($refreshMatch.Success) { $refreshMatch.Groups[1].Value } else { '' }
    ExpirationTime = if ($expiryMatch.Success) { $expiryMatch.Groups[1].Value } else { '' }
  }
}

function Write-WranglerAuthContext {
  param(
    [string]$AccessToken,
    [string]$RefreshToken,
    [string]$ExpirationTime
  )
  $raw = Get-Content $wranglerAuthPath -Raw
  $updated = $raw
  $updated = [regex]::Replace($updated, 'oauth_token\s*=\s*"([^"]*)"', "oauth_token = `"$AccessToken`"")
  if ([string]::IsNullOrWhiteSpace($RefreshToken)) {
    $updated = [regex]::Replace($updated, 'refresh_token\s*=\s*"([^"]*)"', 'refresh_token = ""')
  } elseif ($updated -match 'refresh_token\s*=') {
    $updated = [regex]::Replace($updated, 'refresh_token\s*=\s*"([^"]*)"', "refresh_token = `"$RefreshToken`"")
  } else {
    $updated = $updated.TrimEnd() + "`r`nrefresh_token = `"$RefreshToken`"`r`n"
  }
  if ([string]::IsNullOrWhiteSpace($ExpirationTime)) {
    $updated = [regex]::Replace($updated, 'expiration_time\s*=\s*"([^"]*)"', '')
  } elseif ($updated -match 'expiration_time\s*=') {
    $updated = [regex]::Replace($updated, 'expiration_time\s*=\s*"([^"]*)"', "expiration_time = `"$ExpirationTime`"")
  } else {
    $updated = $updated.TrimEnd() + "`r`nexpiration_time = `"$ExpirationTime`"`r`n"
  }
  Set-Content -Path $wranglerAuthPath -Value $updated -Encoding UTF8
}

function Invoke-AuthForm {
  param(
    [string]$Uri,
    [string]$Body
  )
  try {
    return Invoke-RestMethod -Uri $Uri -Method Post -Proxy $proxy -ContentType 'application/x-www-form-urlencoded' -Body $Body -DisableKeepAlive
  } catch {
    $response = $_.Exception.Response
    if ($response) {
      $stream = $response.GetResponseStream()
      if ($stream) {
        $reader = New-Object System.IO.StreamReader($stream)
        $bodyText = $reader.ReadToEnd()
        $reader.Dispose()
        throw "Cloudflare auth refresh failed:`n$bodyText"
      }
    }
    throw
  }
}

function Get-ActiveWranglerToken {
  if (-not [string]::IsNullOrWhiteSpace($env:CLOUDFLARE_API_TOKEN)) {
    return $env:CLOUDFLARE_API_TOKEN.Trim()
  }
  $context = Read-WranglerAuthContext
  $expiresAt = $null
  if (-not [string]::IsNullOrWhiteSpace($context.ExpirationTime)) {
    try {
      $expiresAt = [DateTimeOffset]::Parse($context.ExpirationTime)
    } catch {
      $expiresAt = $null
    }
  }
  $needsRefresh = $true
  if ($expiresAt) {
    $needsRefresh = $expiresAt -le [DateTimeOffset]::UtcNow.AddMinutes(2)
  }
  if (-not $needsRefresh) {
    return $context.AccessToken
  }
  if ([string]::IsNullOrWhiteSpace($context.RefreshToken)) {
    throw 'Wrangler access token is expired and no refresh_token is available.'
  }
  $body = 'grant_type=refresh_token' +
    '&refresh_token=' + [System.Uri]::EscapeDataString($context.RefreshToken) +
    '&client_id=' + [System.Uri]::EscapeDataString($wranglerClientId)
  $refreshResponse = Invoke-AuthForm -Uri $wranglerTokenUrl -Body $body
  if (-not $refreshResponse.access_token) {
    throw 'Cloudflare auth refresh response did not include access_token.'
  }
  $newRefreshToken = if ($refreshResponse.refresh_token) { [string]$refreshResponse.refresh_token } else { $context.RefreshToken }
  $newExpiry = [DateTimeOffset]::UtcNow.AddSeconds([int]$refreshResponse.expires_in).ToString('o')
  Write-WranglerAuthContext -AccessToken ([string]$refreshResponse.access_token) -RefreshToken $newRefreshToken -ExpirationTime $newExpiry
  return [string]$refreshResponse.access_token
}

function Read-Jsonc {
  param([string]$Path)
  $raw = Get-Content $Path -Raw
  $withoutComments = [regex]::Replace($raw, '^\s*//.*$', '', [System.Text.RegularExpressions.RegexOptions]::Multiline)
  return $withoutComments | ConvertFrom-Json
}

function New-HashString {
  param([byte[]]$Bytes, [string]$Extension)
  $sha = [System.Security.Cryptography.SHA256]::Create()
  try {
    $base64 = [Convert]::ToBase64String($Bytes)
    $hashBytes = $sha.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($base64 + $Extension))
    return ([BitConverter]::ToString($hashBytes)).Replace('-', '').ToLower().Substring(0, 32)
  } finally {
    $sha.Dispose()
  }
}

function Get-AssetManifest {
  param([string]$BaseDir)
  $manifest = [ordered]@{}
  $hashMap = @{}
  $files = Get-ChildItem -Path $BaseDir -Recurse -File
  foreach ($file in $files) {
    $relativePath = $file.FullName.Substring($BaseDir.Length).TrimStart('\').Replace('\', '/')
    $manifestPath = "/$relativePath"
    $bytes = [System.IO.File]::ReadAllBytes($file.FullName)
    $extension = [System.IO.Path]::GetExtension($file.FullName).TrimStart('.')
    $hash = New-HashString -Bytes $bytes -Extension $extension
    $manifest[$manifestPath] = [ordered]@{
      hash = $hash
      size = $bytes.Length
    }
    $hashMap[$hash] = [ordered]@{
      manifestPath = $manifestPath
      fullPath = $file.FullName
    }
  }
  return @{
    Manifest = $manifest
    HashMap = $hashMap
  }
}

function Invoke-CfJson {
  param(
    [string]$Method,
    [string]$Uri,
    [string]$AuthToken,
    [object]$Body = $null
  )
  $handler = [System.Net.Http.HttpClientHandler]::new()
  $handler.Proxy = [System.Net.WebProxy]::new($proxy)
  $handler.UseProxy = $true
  $handler.PreAuthenticate = $true
  $handler.SslProtocols = [System.Security.Authentication.SslProtocols]::Tls12
  $client = [System.Net.Http.HttpClient]::new($handler)
  $client.Timeout = [TimeSpan]::FromMinutes(20)
  try {
    $client.DefaultRequestHeaders.Authorization = [System.Net.Http.Headers.AuthenticationHeaderValue]::new('Bearer', $AuthToken)
    $request = [System.Net.Http.HttpRequestMessage]::new([System.Net.Http.HttpMethod]::$Method, $Uri)
    $request.Version = [Version]::new(1, 1)
    if ($null -ne $Body) {
      $json = $Body | ConvertTo-Json -Depth 30 -Compress
      $request.Content = [System.Net.Http.StringContent]::new($json, [System.Text.Encoding]::UTF8, 'application/json')
    }
    $response = $client.SendAsync($request).GetAwaiter().GetResult()
    $content = $response.Content.ReadAsStringAsync().GetAwaiter().GetResult()
    if (-not $response.IsSuccessStatusCode) {
      throw "Cloudflare JSON request failed: $Method $Uri`n$content"
    }
    if ([string]::IsNullOrWhiteSpace($content)) {
      return $null
    }
    return $content | ConvertFrom-Json
  } catch {
    throw
  } finally {
    if ($request) {
      $request.Dispose()
    }
    $client.Dispose()
    $handler.Dispose()
  }
}

function Invoke-CfMultipartPut {
  param(
    [string]$Uri,
    [string]$AuthToken,
    [string]$MetadataPath,
    [array]$ModuleFiles
  )
  $handler = [System.Net.Http.HttpClientHandler]::new()
  $handler.Proxy = [System.Net.WebProxy]::new($proxy)
  $handler.UseProxy = $true
  $handler.PreAuthenticate = $true
  $client = [System.Net.Http.HttpClient]::new($handler)
  $client.Timeout = [TimeSpan]::FromMinutes(20)
  try {
    $client.DefaultRequestHeaders.Authorization = [System.Net.Http.Headers.AuthenticationHeaderValue]::new('Bearer', $AuthToken)
    $form = [System.Net.Http.MultipartFormDataContent]::new()

    $metadataBytes = [System.IO.File]::ReadAllBytes($MetadataPath)
    $metadataContent = [System.Net.Http.ByteArrayContent]::new($metadataBytes)
    $metadataContent.Headers.ContentType = [System.Net.Http.Headers.MediaTypeHeaderValue]::Parse('application/json')
    $form.Add($metadataContent, 'metadata', [System.IO.Path]::GetFileName($MetadataPath))

    foreach ($moduleFile in $ModuleFiles) {
      $moduleBytes = [System.IO.File]::ReadAllBytes($moduleFile.filePath)
      $moduleContent = [System.Net.Http.ByteArrayContent]::new($moduleBytes)
      $moduleContent.Headers.ContentType = [System.Net.Http.Headers.MediaTypeHeaderValue]::Parse('application/javascript+module')
      $form.Add($moduleContent, $moduleFile.name, $moduleFile.name)
    }

    $response = $client.PutAsync($Uri, $form).GetAwaiter().GetResult()
    $content = $response.Content.ReadAsStringAsync().GetAwaiter().GetResult()
    if (-not $response.IsSuccessStatusCode) {
      throw "Cloudflare multipart PUT failed: $($response.StatusCode)`n$content"
    }
    return $content | ConvertFrom-Json
  } finally {
    $client.Dispose()
    $handler.Dispose()
  }
}

function Invoke-CfAssetBucketUpload {
  param(
    [string]$Uri,
    [string]$UploadJwt,
    [hashtable]$Payload
  )
  $handler = [System.Net.Http.HttpClientHandler]::new()
  $handler.Proxy = [System.Net.WebProxy]::new($proxy)
  $handler.UseProxy = $true
  $handler.PreAuthenticate = $true
  $handler.SslProtocols = [System.Security.Authentication.SslProtocols]::Tls12
  $client = [System.Net.Http.HttpClient]::new($handler)
  $client.Timeout = [TimeSpan]::FromMinutes(20)
  try {
    $client.DefaultRequestHeaders.Authorization = [System.Net.Http.Headers.AuthenticationHeaderValue]::new('Bearer', $UploadJwt)
    $form = [System.Net.Http.MultipartFormDataContent]::new()
    foreach ($entry in $Payload.GetEnumerator()) {
      $content = [System.Net.Http.StringContent]::new([string]$entry.Value, [System.Text.Encoding]::UTF8, 'application/null')
      $form.Add($content, [string]$entry.Key, [string]$entry.Key)
    }
    $response = $client.PostAsync($Uri, $form).GetAwaiter().GetResult()
    $content = $response.Content.ReadAsStringAsync().GetAwaiter().GetResult()
    if (-not $response.IsSuccessStatusCode) {
      throw "Cloudflare asset upload failed: $($response.StatusCode)`n$content"
    }
    return $content | ConvertFrom-Json
  } finally {
    $client.Dispose()
    $handler.Dispose()
  }
}

function Get-Bindings {
  param([object]$Config)
  $bindings = New-Object System.Collections.ArrayList
  [void]$bindings.Add([ordered]@{
    name = 'ASSETS'
    type = 'assets'
  })
  foreach ($property in $Config.vars.PSObject.Properties) {
    [void]$bindings.Add([ordered]@{
      name = $property.Name
      type = 'plain_text'
      text = [string]$property.Value
    })
  }
  foreach ($db in $Config.d1_databases) {
    [void]$bindings.Add([ordered]@{
      name = $db.binding
      type = 'd1'
      id = $db.database_id
    })
  }
  return $bindings
}

function Get-ModuleFiles {
  param([object]$Config)
  return @(
    [ordered]@{
      name = [System.IO.Path]::GetFileName($Config.main)
      filePath = (Join-Path $root $Config.main)
    },
    [ordered]@{
      name = 'worker-gateway-d1.js'
      filePath = (Join-Path $srcDir 'worker-gateway-d1.js')
    }
  )
}

Ensure-Directory $tmpDir

$token = Get-ActiveWranglerToken
$config = Read-Jsonc $wranglerConfigPath
$workerName = [string]$config.name
if ([string]::IsNullOrWhiteSpace($workerName)) {
  throw 'wrangler.jsonc is missing worker name.'
}

$assetData = Get-AssetManifest -BaseDir $distDir
$manifestPayload = [ordered]@{
  manifest = $assetData.Manifest
}
$manifestPath = Join-Path $tmpDir 'manifest.json'
Write-Utf8NoBomFile -Path $manifestPath -Content ($manifestPayload | ConvertTo-Json -Depth 30)

Write-Host "Starting asset upload session for $workerName..."
$uploadSession = Invoke-CfJson -Method 'POST' -Uri "https://api.cloudflare.com/client/v4/accounts/$accountId/workers/scripts/$workerName/assets-upload-session" -AuthToken $token -Body $manifestPayload
$uploadResult = $uploadSession.result
$uploadJwt = [string]$uploadResult.jwt
$buckets = @($uploadResult.buckets)
if ([string]::IsNullOrWhiteSpace($uploadJwt)) {
  throw 'Asset upload session did not return a jwt.'
}

$completionJwt = $uploadJwt
if ($buckets.Count -gt 0) {
  for ($index = 0; $index -lt $buckets.Count; $index += 1) {
    $bucket = @($buckets[$index])
    Write-Host ("Uploading asset bucket {0}/{1} ({2} files)..." -f ($index + 1), $buckets.Count, $bucket.Count)
    $payload = [ordered]@{}
    foreach ($hash in $bucket) {
      $fileInfo = $assetData.HashMap[$hash]
      if (-not $fileInfo) {
        throw "Unable to resolve uploaded hash $hash to a local file."
      }
      $payload[$hash] = [Convert]::ToBase64String([System.IO.File]::ReadAllBytes($fileInfo.fullPath))
    }
    $uploadResponse = Invoke-CfAssetBucketUpload -Uri "https://api.cloudflare.com/client/v4/accounts/$accountId/workers/assets/upload?base64=true" -UploadJwt $uploadJwt -Payload $payload
    if ($uploadResponse.result.jwt) {
      $completionJwt = [string]$uploadResponse.result.jwt
    }
  }
}

$metadata = [ordered]@{
  main_module = [System.IO.Path]::GetFileName($config.main)
  compatibility_date = [string]$config.compatibility_date
  bindings = (Get-Bindings -Config $config)
  assets = [ordered]@{
    jwt = $completionJwt
    config = [ordered]@{
      html_handling = 'auto-trailing-slash'
      not_found_handling = 'single-page-application'
    }
  }
}
$metadataPath = Join-Path $tmpDir 'metadata.json'
Write-Utf8NoBomFile -Path $metadataPath -Content ($metadata | ConvertTo-Json -Depth 30)

Write-Host "Publishing worker modules and metadata..."
$deployResponse = Invoke-CfMultipartPut -Uri "https://api.cloudflare.com/client/v4/accounts/$accountId/workers/scripts/$workerName" -AuthToken $token -MetadataPath $metadataPath -ModuleFiles (Get-ModuleFiles -Config $config)
Write-Host "Verifying deployed worker service..."
$verifyResponse = Invoke-CfJson -Method 'GET' -Uri "https://api.cloudflare.com/client/v4/accounts/$accountId/workers/services/$workerName" -AuthToken $token

$result = [ordered]@{
  deployResponse = $deployResponse
  verifyResponse = $verifyResponse
}
$resultPath = Join-Path $tmpDir 'deploy-result.json'
Write-Utf8NoBomFile -Path $resultPath -Content ($result | ConvertTo-Json -Depth 30)
$result | ConvertTo-Json -Depth 30
