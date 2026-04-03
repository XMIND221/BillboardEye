$ErrorActionPreference = "Stop"

function Get-LanIPv4 {
  $candidates = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
    Where-Object {
      $_.IPAddress -notlike "127.*" -and
      $_.IPAddress -notlike "169.254.*" -and
      $_.ValidLifetime -gt ([TimeSpan]::Zero)
    } |
    Sort-Object -Property InterfaceMetric, SkipAsSource

  if (-not $candidates) {
    throw "Impossible de detecter une IP LAN IPv4 active."
  }

  return $candidates[0].IPAddress
}

$lanIp = Get-LanIPv4
$env:EXPO_NO_DEPENDENCY_VALIDATION = ""
$env:REACT_NATIVE_PACKAGER_HOSTNAME = $lanIp

Write-Host "IP LAN detectee: $lanIp"
Write-Host "Lancement Expo Go en LAN (sans emulateur)..."
Write-Host "N'appuie pas sur 'a'. Ouvre Expo Go et scanne le QR."

if (Test-Path ".\node_modules\@expo\cli\build\bin\cli") {
  node .\node_modules\@expo\cli\build\bin\cli start --host lan --port 8081 --clear
} elseif (Test-Path ".\node_modules\expo\bin\cli") {
  node .\node_modules\expo\bin\cli start --host lan --port 8081 --clear
} else {
  throw "Expo CLI introuvable dans node_modules. Lance d'abord npm install."
}
