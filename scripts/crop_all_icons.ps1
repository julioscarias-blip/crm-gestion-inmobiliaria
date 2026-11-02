Add-Type -AssemblyName System.Drawing

$srcPath = Join-Path (Get-Location) "iconos redes sociales.jpg"
$outDir = Join-Path (Get-Location) "public\icons"

if (-not (Test-Path $outDir)) {
    New-Item -ItemType Directory -Path $outDir -Force | Out-Null
}

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

# Radius for crop: the circle itself has radius ~36px, with shadow it reaches ~52px
$boxHalf = 58  # 116x116 total size

foreach ($item in $icons) {
    $name = $item[0]
    $cx = $item[1]
    $cy = $item[2]

    $cropX = [math]::Max(0, $cx - $boxHalf)
    $cropY = [math]::Max(0, $cy - $boxHalf)
    $cropW = $boxHalf * 2
    $cropH = $boxHalf * 2

    # Create target bitmap 32-bit ARGB
    $target = New-Object System.Drawing.Bitmap($cropW, $cropH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($target)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    # Draw the cropped region
    $srcRect = New-Object System.Drawing.Rectangle($cropX, $cropY, $cropW, $cropH)
    $destRect = New-Object System.Drawing.Rectangle(0, 0, $cropW, $cropH)
    $g.DrawImage($bmp, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
    $g.Dispose()

    # Save square raw cropped
    $rawPath = Join-Path $outDir "$name.png"
    $target.Save($rawPath, [System.Drawing.Imaging.ImageFormat]::Png)

    # Also let's create a circular transparent version so it blends seamlessly on any background
    $circleTarget = New-Object System.Drawing.Bitmap($cropW, $cropH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $cg = [System.Drawing.Graphics]::FromImage($circleTarget)
    $cg.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $cg.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $path.AddEllipse(2, 2, $cropW - 4, $cropH - 4)
    $cg.SetClip($path)
    $cg.DrawImage($target, 0, 0)
    $path.Dispose()
    $cg.Dispose()

    $circlePath = Join-Path $outDir "$($name)_circle.png"
    $circleTarget.Save($circlePath, [System.Drawing.Imaging.ImageFormat]::Png)

    $target.Dispose()
    $circleTarget.Dispose()

    Write-Host "Exported $name to $rawPath and $circlePath"
}

$bmp.Dispose()
Write-Host "Done exporting all 16 modern icons!"
