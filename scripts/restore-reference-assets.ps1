$ErrorActionPreference = 'Stop'
$referenceAssets = @{
  'https://framerusercontent.com/images/jYzrDuPatfcX7dhxPHO12SwNaKU.png' = 'public/assets/textures/about-grunge.png'
  'https://framerusercontent.com/images/idr6RaCW9rZ0SNF2VHhbobGU.png' = 'public/assets/textures/pale-marble.png'
  'https://framerusercontent.com/images/ophBL9h62x1FjMrHEasHVBnfek.png' = 'public/assets/branding/jacob-origins.png'
}
foreach ($asset in $referenceAssets.GetEnumerator()) {
  if (!(Test-Path -LiteralPath $asset.Value)) {
    Invoke-WebRequest -Uri $asset.Key -OutFile $asset.Value
  }
}
