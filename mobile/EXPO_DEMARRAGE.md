# Démarrer Expo (Windows)

Si `npx expo start -c` affiche **`Body is unusable: Body has already been read`**, c’est un bug connu de la **validation des dépendances** d’Expo avec certaines versions de Node.

**Solutions (une suffit) :**

1. **Recommandé** — depuis le dossier `mobile` :
   ```bash
   npm run start:clear
   ```
   (définit déjà `EXPO_NO_DEPENDENCY_VALIDATION=1` via `cross-env`)

2. Ou ajoute dans ton fichier **`.env`** :
   ```env
   EXPO_NO_DEPENDENCY_VALIDATION=1
   ```
   puis relance `npx expo start -c`.

3. Ou en une ligne PowerShell :
   ```powershell
   $env:EXPO_NO_DEPENDENCY_VALIDATION=1; npx expo start -c
   ```

La validation des versions de paquets est alors ignorée ; ton `package.json` / lockfile restent la référence.
