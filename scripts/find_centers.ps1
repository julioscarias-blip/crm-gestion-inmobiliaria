Add-Type -AssemblyName System.Drawing

$filePath = Join-Path (Get-Location) "iconos redes sociales.jpg"
$bmp = [System.Drawing.Bitmap]::FromFile($filePath)

# Let's find dark pixels (brightness < 0.4 or R < 100)
# and get minX, maxX, minY, maxY for each of the 16 cells
$cellW = $bmp.Width / 4.0
$cellH = $bmp.Height / 4.0

for ($row = 0; $row -lt 4; $row++) {
    for ($col = 0; $col -lt 4; $col++) {
        $x0 = [int]($col * $cellW)
        $x1 = [int](($col + 1) * $cellW)
        $y0 = [int]($row * $cellH)
        $y1 = [int](($row + 1) * $cellH)

        $minX = 9999; $maxX = -1; $minY = 9999; $maxY = -1
        $countDark = 0

        for ($y = $y0; $y -lt $y1; $y++) {
            for ($x = $x0; $x -lt $x1; $x++) {
                $c = $bmp.GetPixel($x, $y)
                # Circle ring or icon has dark pixels: R < 80, G < 80, B < 80
                if ($c.R -lt 80 -and $c.G -lt 80 -and $c.B -lt 80) {
                    if ($x -lt $minX) { $minX = $x }
                    if ($x -gt $maxX) { $maxX = $x }
                    if ($y -lt $minY) { $minY = $y }
                    if ($y -gt $maxY) { $maxY = $y }
                    $countDark++
                }
            }
        }

        $w = $maxX - $minX
        $h = $maxY - $minY
        $cx = [math]::Round(($minX + $maxX) / 2)
        $cy = [math]::Round(($minY + $maxY) / 2)
        Write-Host "Row $row Col $col : X=[$minX, $maxX] Y=[$minY, $maxY] -> Center=($cx, $cy) Size=($w x $h)"
    }
}

$bmp.Dispose()
