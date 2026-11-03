$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$assetRoot = [IO.Path]::GetFullPath((Join-Path $PWD 'public/assets'))
$files = Get-ChildItem -LiteralPath $assetRoot -Recurse -File | Where-Object Extension -Match '^\.(jpg|png)$'
foreach ($file in $files) {
  $inputImage = [System.Drawing.Image]::FromFile($file.FullName)
  $maxDimension = if ($file.Directory.Name -eq 'textures') { 1800 } else { 1600 }
  $ratio = [Math]::Min([double]1, [double]$maxDimension / [Math]::Max([double]$inputImage.Width, [double]$inputImage.Height))
  if ($ratio -ge 1) { $inputImage.Dispose(); continue }
  $outputWidth = [Math]::Max(1,[int]($inputImage.Width*$ratio))
  $outputHeight = [Math]::Max(1,[int]($inputImage.Height*$ratio))
  if ($inputImage.Width -gt 10 -and $inputImage.Height -gt 10 -and ($outputWidth -lt 10 -or $outputHeight -lt 10)) {
    $inputImage.Dispose()
    throw "Refusing to collapse image dimensions: $($file.Name)"
  }
  $outputImage = [System.Drawing.Bitmap]::new($outputWidth,$outputHeight)
  $graphics = [System.Drawing.Graphics]::FromImage($outputImage)
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.DrawImage($inputImage,0,0,$outputImage.Width,$outputImage.Height)
  $inputImage.Dispose()
  $temporaryFile = $file.FullName + '.optimized'
  $format = if ($file.Extension -eq '.jpg') { [System.Drawing.Imaging.ImageFormat]::Jpeg } else { [System.Drawing.Imaging.ImageFormat]::Png }
  $outputImage.Save($temporaryFile,$format)
  $graphics.Dispose(); $outputImage.Dispose()
  Move-Item -LiteralPath $temporaryFile -Destination $file.FullName -Force
}
Write-Output 'Optimized website copies. Original source artwork was not modified.'
