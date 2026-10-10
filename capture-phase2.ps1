$chrome = "C:\Users\chlov\AppData\Local\ms-playwright\chromium-1234\chrome-win64\chrome.exe"
$outDir = "d:\Projects from me\slavey game\screenshots"
$chromeDir = "C:\Users\chlov\AppData\Local\ms-playwright\chromium-1234\chrome-win64"

if (!(Test-Path $outDir)) {
    New-Item -ItemType Directory -Path $outDir -Force
}

function Capture-Shot($url, $file, $width, $height) {
    Write-Host "Capturing $file ($width x $height) from $url ..."
    Start-Process -FilePath $chrome -ArgumentList "--headless=new", "--window-size=$width,$height", "--virtual-time-budget=3500", "--screenshot=$file", "$url" -Wait -NoNewWindow
    if (Test-Path "$chromeDir\$file") {
        Move-Item "$chromeDir\$file" "$outDir\$file" -Force
        Write-Host "Saved: $outDir\$file"
    } else {
        Write-Warning "Could not find $chromeDir\$file"
    }
}

# All 7 Target Time Checkpoints (1920x1080, same exact camera angle at spawn)
Capture-Shot "http://localhost:5174/?started=1&time=06:30" "phase2_01_sunrise_0630_1920x1080.png" 1920 1080
Capture-Shot "http://localhost:5174/?started=1&time=08:00" "phase2_02_morning_0800_1920x1080.png" 1920 1080
Capture-Shot "http://localhost:5174/?started=1&time=12:00" "phase2_03_midday_1200_1920x1080.png" 1920 1080
Capture-Shot "http://localhost:5174/?started=1&time=17:00" "phase2_04_goldenhour_1700_1920x1080.png" 1920 1080
Capture-Shot "http://localhost:5174/?started=1&time=18:30" "phase2_05_sunset_1830_1920x1080.png" 1920 1080
Capture-Shot "http://localhost:5174/?started=1&time=19:30" "phase2_06_twilight_1930_1920x1080.png" 1920 1080
Capture-Shot "http://localhost:5174/?started=1&time=22:30" "phase2_07_night_2230_1920x1080.png" 1920 1080

# Key Checkpoints at 1440x900
Capture-Shot "http://localhost:5174/?started=1&time=06:30" "phase2_01_sunrise_0630_1440x900.png" 1440 900
Capture-Shot "http://localhost:5174/?started=1&time=18:30" "phase2_05_sunset_1830_1440x900.png" 1440 900
Capture-Shot "http://localhost:5174/?started=1&time=22:30" "phase2_07_night_2230_1440x900.png" 1440 900

Write-Host "All 7 Time Checkpoints captured successfully!"
Get-ChildItem -Path $outDir -Filter "phase2_*"
