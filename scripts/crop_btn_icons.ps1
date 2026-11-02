Add-Type -AssemblyName System.Drawing

$srcPath = Join-Path (Get-Location) "iconos redes sociales.jpg"
$outDir = Join-Path (Get-Location) "public\icons"

$bmp = [System.Drawing.Bitmap]::FromFile($srcPath)

$icons = @(
    @("facebook", 98, 97),
    @("youtube", 242, 97),
    @("instagram", 386, 97),
    @("twitter", 530, 97),
    @("whatsapp", 98, 249),
    @("tiktok", 242, 249),
    @("snapchat", 386, 249),
    @("linkedin", 530, 249),
    @("skype", 98, 392),
    @("reddit", 242, 392),
    @("telegram", 386, 392),
    @("behance", 530, 392),
    @("vimeo", 98, 532),
    @("wechat", 242, 532),
    @("pinterest", 386, 532),
    @("vk", 530, 532)
)

$r = 37  # 74x74 circular button exactly around the dark border
$size = $r * 2

foreach ($item in $icons) {
    $name = $item[0]
    $cx = $item[1]
    $cy = $item[2]

    $target = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($target)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    # Clip to circle
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $path.AddEllipse(0, 0, $size, $size)
    $g.SetClip($path)

    $srcRect = New-Object System.Drawing.Rectangle(($cx - $r), ($cy - $r), $size, $size)
    $destRect = New-Object System.Drawing.Rectangle(0, 0, $size, $size)
    $g.DrawImage($bmp, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)

    $path.Dispose()
    $g.Dispose()

    $btnPath = Join-Path $outDir "$($name)_btn.png"
    $target.Save($btnPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $target.Dispose()
}

$bmp.Dispose()
Write-Host "Exported tight circular button icons!"
