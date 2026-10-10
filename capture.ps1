$chrome = "C:\Users\chlov\AppData\Local\ms-playwright\chromium-1234\chrome-win64\chrome.exe"
$outDir = "d:\Projects from me\slavey game\screenshots"
$chromeDir = "C:\Users\chlov\AppData\Local\ms-playwright\chromium-1234\chrome-win64"

function Capture-Shot($url, $file, $width, $height) {
    Write-Host "Capturing $file ($width x $height)..."
    Start-Process -FilePath $chrome -ArgumentList "--headless=new", "--window-size=$width,$height", "--virtual-time-budget=2000", "--screenshot=$file", "$url" -Wait -NoNewWindow
    Move-Item "$chromeDir\$file" "$outDir\$file" -Force
}

Capture-Shot "http://localhost:5174/?started=1" "after_ingame_1920x1080.png" 1920 1080
Capture-Shot "http://localhost:5174/?started=1" "after_ingame_1440x900.png" 1440 900
Capture-Shot "http://localhost:5174/?started=1&cam=garden" "after_viewpoint2_garden_1920x1080.png" 1920 1080
Capture-Shot "http://localhost:5174/?started=1&cam=orchard" "after_viewpoint3_orchard_1920x1080.png" 1920 1080

Write-Host "All screenshots captured successfully!"
Get-ChildItem -Path $outDir
