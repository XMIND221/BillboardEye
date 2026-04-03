@echo off
setlocal enabledelayedexpansion

echo === BillboardEye Mobile Doctor (Windows) ===
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo [ERREUR] Node.js introuvable dans PATH.
  exit /b 1
)

for /f %%V in ('node -p "process.versions.node"') do set "NODEV=%%V"
for /f %%M in ('node -p "process.versions.node.split('.')[0]"') do set "NODEMAJOR=%%M"
echo [OK] Node detecte: v%NODEV%
if %NODEMAJOR% LSS 20 (
  echo [ERREUR] Node ^>= 20 requis. Installe Node 20 LTS.
  exit /b 1
)
if %NODEMAJOR% GTR 22 (
  echo [WARN] Node v%NODEV% detecte. Recommande: Node 20 LTS pour Expo.
)

if not exist "node_modules" (
  echo [ERREUR] node_modules absent. Lance: npm install
  exit /b 1
)
echo [OK] node_modules present

if exist "node_modules\@expo\cli\build\bin\cli" (
  echo [OK] Expo CLI local: @expo/cli
) else if exist "node_modules\expo\bin\cli" (
  echo [OK] Expo CLI local: expo/bin/cli
) else (
  echo [ERREUR] Expo CLI local introuvable. Lance: npm install
  exit /b 1
)

echo.
echo [INFO] Variables proxy:
echo HTTP_PROXY=%HTTP_PROXY%
echo HTTPS_PROXY=%HTTPS_PROXY%
echo.
echo [INFO] npm proxy:
npm config get proxy
npm config get https-proxy

echo.
echo [INFO] Ports ecoutes 8081/19000/19001:
netstat -ano | findstr /R /C:":8081 .*LISTENING" /C:":19000 .*LISTENING" /C:":19001 .*LISTENING"
echo.
echo [OK] Diagnostic termine.
exit /b 0
