# Installe platform-tools + emulator dans %LOCALAPPDATA%\Android\Sdk (Windows)
# Prérequis : command-line tools dans Sdk\cmdline-tools\latest (voir téléchargement Google)
$ErrorActionPreference = "Stop"

$sdk = if ($env:ANDROID_HOME) { $env:ANDROID_HOME } else { "$env:LOCALAPPDATA\Android\Sdk" }
$jbr = "C:\Program Files\Android\Android Studio\jbr"
if (-not (Test-Path "$jbr\bin\java.exe")) {
  Write-Error "JDK Android Studio introuvable : $jbr"
}

$env:JAVA_HOME = $jbr
$env:Path = "$jbr\bin;$env:Path"

$sm = Join-Path $sdk "cmdline-tools\latest\bin\sdkmanager.bat"
if (-not (Test-Path $sm)) {
  Write-Error "sdkmanager introuvable : $sm`nTélécharge commandlinetools-win-*_latest.zip et place sous cmdline-tools\latest"
}

Write-Host "[install-android-sdk] SDK root: $sdk"
Write-Host "[install-android-sdk] JAVA_HOME: $env:JAVA_HOME"

# Licences (réponses y répétées)
$yesFile = Join-Path $env:TEMP "android-sdk-yes.txt"
1..120 | ForEach-Object { "y" } | Set-Content -Path $yesFile -Encoding ASCII
Get-Content $yesFile | & cmd /c "`"$sm`" --sdk_root=`"$sdk`" --licenses" 2>&1 | Out-Host

Write-Host "[install-android-sdk] Installation des paquets..."
& cmd /c "`"$sm`" --sdk_root=`"$sdk`" `"platform-tools`" `"emulator`" `"platforms;android-34`"" 2>&1 | Out-Host

Write-Host "[install-android-sdk] adb: $(Test-Path `"$sdk\platform-tools\adb.exe`")"
Write-Host "[install-android-sdk] emulator: $(Test-Path `"$sdk\emulator\emulator.exe`")"
