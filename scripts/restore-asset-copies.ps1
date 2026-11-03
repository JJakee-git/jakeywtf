$ErrorActionPreference = 'Stop'
$workAssets = 'D:\00 Chapman Work\GD 402 - UX2\P3_Portfolio\Works'
$localAssets = @{
  'public/assets/branding/logo.png' = 'original-assets/LogoWhite-01.png'
  'public/assets/branding/crown.png' = 'original-assets/194-1941681_basquiat-crown-png-jean-michel-basquiat-crown-png.png'
  'public/assets/textures/marble.jpg' = 'original-assets/marble-close-up-view-2025-02-22-15-08-36-utc.jpg'
  'public/assets/projects/frame.png' = (Join-Path $workAssets 'frame.png')
  'public/assets/projects/plaque.png' = (Join-Path $workAssets 'LABEL.png')
  'public/assets/projects/mercedes-poster.jpg' = (Join-Path $workAssets 'Spierer_J_P1_MBCC_POSTER_F2024_GD200.jpg')
  'public/assets/projects/mercedes-framed.png' = (Join-Path $workAssets 'frame2.png')
  'public/assets/projects/fjallraven-framed.png' = (Join-Path $workAssets 'frame3.png')
  'public/assets/projects/monogram.png' = (Join-Path $workAssets 'js.png')
  'public/assets/projects/jerusalem-stamp.png' = (Join-Path $workAssets 'Sticker-page1.png')
  'public/assets/projects/spierer-university-mascot.png' = 'D:\00 Chapman Work\GD 200 - Intro to Graphic Design\02 MASCOT PROJECT\07 Final Mascot\Asset 1LogoC.png'
  'public/assets/projects/spierer-university-identity.png' = (Join-Path $workAssets 'Mascot.png')
  'public/assets/projects/spierer-university-catalog.png' = (Join-Path $workAssets 'Catalog.png')
  'public/assets/projects/spierer-university-catalog-contents.png' = (Join-Path $workAssets 'Catalog2.png')
  'public/assets/projects/spierer-university-catalog-knives.png' = (Join-Path $workAssets 'Catalog3.png')
  'public/assets/projects/spierer-university-sticker.png' = (Join-Path $workAssets 'Sticker-page4.png')
  'public/assets/projects/fjallraven-patterns.png' = (Join-Path $workAssets 'FINAL_Spierer_J_FinalSell_Patterns-01.png')
  'public/assets/projects/fjallraven-backpack.png' = 'D:\00 Chapman Work\GD 203 - Color\P2_FjallRaven\P1 Pattern\Finals\HeroModel.png'
  'public/assets/projects/fjallraven-toss.png' = 'D:\00 Chapman Work\GD 203 - Color\P2_FjallRaven\P1 Pattern\Finals\TossModel.png'
}
foreach ($asset in $localAssets.GetEnumerator()) {
  Copy-Item -LiteralPath $asset.Value -Destination $asset.Key -Force
}
Write-Output 'Restored local artwork copies.'
$manifest = Get-Content -LiteralPath 'docs/reference-assets.json' -Raw -Encoding UTF8 | ConvertFrom-Json
foreach ($asset in $manifest) {
  $destination = Join-Path 'public' $asset.file
  if (Test-Path -LiteralPath $destination) {
    Invoke-WebRequest -Uri $asset.source -OutFile $destination
  }
}
Write-Output 'Restored imported Framer image copies.'
