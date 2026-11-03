$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
Add-Type -AssemblyName System.Drawing
$source = Join-Path $PWD 'original-assets/figma-export/PORTFOLIO WEBSITE.fig'
$outputRoot = [IO.Path]::GetFullPath((Join-Path $PWD 'original-assets/figma-export/extracted'))
$imageRoot = Join-Path $outputRoot 'images'
New-Item -ItemType Directory -Force -Path $imageRoot,'.local/figma-contact-sheets' | Out-Null
$archive = [IO.Compression.ZipFile]::OpenRead($source)
$inventory = @()
try {
  foreach ($entry in $archive.Entries) {
    if (!$entry.Length) { continue }
    $inputStream = $entry.Open()
    $memory = [IO.MemoryStream]::new()
    try { $inputStream.CopyTo($memory); $bytes = $memory.ToArray() }
    finally { $inputStream.Dispose(); $memory.Dispose() }
    if ($entry.FullName.StartsWith('images/')) {
      $name = [IO.Path]::GetFileName($entry.FullName)
      if ($name -notmatch '^[a-f0-9]+$') { throw "Unexpected image entry: $name" }
      $format = 'bin'
      if ($bytes[0] -eq 137 -and $bytes[1] -eq 80) { $format = 'png' }
      elseif ($bytes[0] -eq 255 -and $bytes[1] -eq 216) { $format = 'jpg' }
      elseif ([Text.Encoding]::ASCII.GetString($bytes,0,3) -eq 'GIF') { $format = 'gif' }
      elseif ([Text.Encoding]::ASCII.GetString($bytes,0,4) -eq 'RIFF') { $format = 'webp' }
      $destination = Join-Path $imageRoot "$name.$format"
      [IO.File]::WriteAllBytes($destination,$bytes)
      $width = 0; $height = 0
      try { $im = [Drawing.Image]::FromFile($destination); $width = $im.Width; $height = $im.Height; $im.Dispose() } catch { }
      $inventory += [pscustomobject]@{id=$name;file="images/$name.$format";format=$format;width=$width;height=$height;bytes=$bytes.Length}
    } elseif ($entry.FullName -in @('canvas.fig','thumbnail.png','meta.json')) {
      [IO.File]::WriteAllBytes((Join-Path $outputRoot $entry.FullName),$bytes)
    }
  }
} finally { $archive.Dispose() }
$inventory | ConvertTo-Json -Depth 3 | Set-Content -LiteralPath (Join-Path $outputRoot 'inventory.json') -Encoding UTF8
$pageSize = 48
for ($offset = 0; $offset -lt $inventory.Count; $offset += $pageSize) {
  $batch = @($inventory | Select-Object -Skip $offset -First $pageSize)
  $sheet = [Drawing.Bitmap]::new(1440,([int][Math]::Ceiling($batch.Count/6.0)*190))
  $graphics = [Drawing.Graphics]::FromImage($sheet)
  $graphics.Clear([Drawing.Color]::FromArgb(105,105,105))
  $font = [Drawing.Font]::new('Arial',10)
  for ($i = 0; $i -lt $batch.Count; $i++) {
    $asset = $batch[$i]; $x = ($i % 6)*240; $y = [Math]::Floor($i/6.0)*190
    if ($asset.width -gt 0) {
      $im = [Drawing.Image]::FromFile((Join-Path $outputRoot $asset.file))
      $ratio = [Math]::Min(225.0/$im.Width,150.0/$im.Height)
      $graphics.DrawImage($im,[int]$x,[int]$y,[int]($im.Width*$ratio),[int]($im.Height*$ratio))
      $im.Dispose()
    }
    $graphics.DrawString("$($offset+$i): $($asset.id.Substring(0,10))",$font,[Drawing.Brushes]::White,[single]$x,[single]($y+153))
    $graphics.DrawString("$($asset.width) x $($asset.height)",$font,[Drawing.Brushes]::White,[single]$x,[single]($y+170))
  }
  $sheet.Save((Join-Path $PWD ".local/figma-contact-sheets/sheet-$([int]($offset/$pageSize)+1).jpg"))
  $graphics.Dispose(); $font.Dispose(); $sheet.Dispose()
}
Write-Output "Extracted $($inventory.Count) embedded images without changing the .fig file."
