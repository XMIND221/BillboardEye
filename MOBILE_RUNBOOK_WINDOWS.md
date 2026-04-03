# BillboardEye Mobile - Runbook Windows (Expo Go iOS/Android)

## 1) Pre-requis

- Node.js LTS `20.x` recommande.
- Meme reseau Wi-Fi entre PC et telephone.
- Expo Go installe sur iOS/Android.

## 2) Installation propre

Depuis `mobile`:

```cmd
npm install
npm run doctor
```

Si `doctor` affiche Node > 22, repasser en Node 20 LTS.

## 3) Lancement standard Expo Go (LAN)

```cmd
npm run start:go
```

Important:

- Ne pas appuyer sur `a` (cela cherche un emulateur Android local).
- Scanner le QR avec Expo Go.
- Si scan KO, ouvrir manuellement `exp://<IP_PC>:8081` dans Expo Go.

## 4) Pare-feu et ports

Executer une fois en CMD administrateur:

```cmd
netsh advfirewall firewall add rule name="Expo 8081" dir=in action=allow protocol=TCP localport=8081 profile=private
netsh advfirewall firewall add rule name="Expo 19000" dir=in action=allow protocol=TCP localport=19000 profile=private
netsh advfirewall firewall add rule name="Expo 19001" dir=in action=allow protocol=TCP localport=19001 profile=private
```

## 5) Fallback web (iOS sans compte Apple)

Depuis `mobile`:

```cmd
npm run web
```

Puis ouvrir l'URL locale affichee sur PC.  
Si besoin d'acces externe, utiliser un tunnel HTTP sur le port web Expo.

## 6) Depannage rapide

- `expo n'est pas reconnu`: refaire `npm install` dans `mobile`.
- `GetEnv.NoBoolean`: ne pas utiliser `EXPO_NO_DEPENDENCY_VALIDATION=1`.
- `No Android connected device`: ignorer, c'est lie a la touche `a`, pas au QR scan.
