Add-Type -AssemblyName System.Drawing
$filePath = Join-Path (Get-Location) "iconos redes sociales.jpg"
$img = [System.Drawing.Bitmap]::FromFile($filePath)
Write-Host "Width: $($img.Width), Height: $($img.Height)"
$img.Dispose()
