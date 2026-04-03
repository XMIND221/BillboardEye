@echo off
setlocal enabledelayedexpansion

set "LAN_IP="
for /f "tokens=2 delims=:" %%A in ('ipconfig ^| findstr /R /C:"IPv4"') do (
  set "CANDIDATE=%%A"
  set "CANDIDATE=!CANDIDATE: =!"
  if not "!CANDIDATE:~0,4!"=="127." if not "!CANDIDATE:~0,8!"=="169.254." (
    set "LAN_IP=!CANDIDATE!"
    goto :ip_found
  )
)

:ip_found
if "%LAN_IP%"=="" (
  echo Impossible de detecter une IP LAN IPv4 active.
  exit /b 1
)

echo IP LAN detectee: %LAN_IP%
echo Lancement Expo Go en LAN ^(sans emulateur^)...
echo N'appuie pas sur "a". Ouvre Expo Go et scanne le QR.

net session >nul 2>&1
if %errorlevel%==0 (
  echo Configuration pare-feu Windows ^(admin detecte^)...
  netsh advfirewall firewall add rule name="Expo 8081" dir=in action=allow protocol=TCP localport=8081 profile=private >nul 2>&1
  netsh advfirewall firewall add rule name="Expo 19000" dir=in action=allow protocol=TCP localport=19000 profile=private >nul 2>&1
  netsh advfirewall firewall add rule name="Expo 19001" dir=in action=allow protocol=TCP localport=19001 profile=private >nul 2>&1
) else (
  echo [INFO] Lance ce script en CMD Administrateur au moins une fois pour ouvrir le pare-feu ^(ports 8081/19000/19001^).
)

for %%P in (8081 8082) do (
  for /f "tokens=5" %%I in ('netstat -ano ^| findstr /R /C:":%%P .*LISTENING"') do (
    if not "%%I"=="0" (
      echo Fermeture du process %%I sur le port %%P...
      taskkill /PID %%I /F >nul 2>&1
    )
  )
)

set "REACT_NATIVE_PACKAGER_HOSTNAME=%LAN_IP%"
set "EXPO_NO_DEPENDENCY_VALIDATION="

if not exist "node_modules\expo\bin\cli" if not exist "node_modules\@expo\cli\build\bin\cli" (
  echo Expo CLI introuvable. Lance d'abord: npm install
  exit /b 1
)

if exist "node_modules\@expo\cli\build\bin\cli" (
  node node_modules\@expo\cli\build\bin\cli start --host lan --clear --port 8081
) else (
  node node_modules\expo\bin\cli start --host lan --clear --port 8081
)
