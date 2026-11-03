$ErrorActionPreference = 'Stop'
$assetUrls = @()
foreach ($page in @('framer-reference','jakey-about','jakey-contact','jakey-work','jakey-mercedes')) {
  $html = Get-Content -LiteralPath "$env:TEMP/$page.html" -Raw -Encoding UTF8
  $assetUrls += [regex]::Matches($html, 'https://framerusercontent.com/images/[^?"\s<>]+\.(?:png|jpg|jpeg|webp)') | ForEach-Object { $_.Value }
}
$manifest = @()
foreach ($url in ($assetUrls | Sort-Object -Unique)) {
  $filename = ($url -split '/')[-1]
  $destination = Join-Path $PWD "public/assets/reference/$filename"
  if (!(Test-Path -LiteralPath $destination)) { Invoke-WebRequest -Uri $url -OutFile $destination }
  $manifest += @{ source = $url; file = "assets/reference/$filename" }
}
$manifest | ConvertTo-Json | Set-Content -LiteralPath 'docs/reference-assets.json' -Encoding UTF8
Write-Output "Imported $($manifest.Count) reference assets."
