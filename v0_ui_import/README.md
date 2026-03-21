# BillboardEye — maquettes UI (v0)

Projet **Next.js 16** généré par v0 : **design uniquement** (données fictives, navigation par état React).

## Lancer en local

Depuis la racine du monorepo :

```bash
npm run ui:v0
```

Ou dans ce dossier :

```bash
npm install
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000) (ou le port indiqué si 3000 est pris).

## Rôle

- **Référence visuelle** pour aligner l’app mobile (Expo) et l’admin.
- **Indépendant** du serveur API et de `tmp_v0_template` (PDF campagne).

## Structure

- `components/billboard-eye-app.tsx` — routeur d’écrans selon `lib/app-context.tsx`
- `components/screens/**` — écrans par domaine (agent, manager, panneaux, reporting…)
- `lib/mock-data.ts` — données de démo

## Intégration

Les écrans React Native existants peuvent reprendre **structure, textes et classes Tailwind** (adaptés en `StyleSheet` / thème).
