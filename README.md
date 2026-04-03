# BillboardEye

API Node (Express) + app mobile Expo + maquettes v0.

## Démarrage rapide

```bash
npm install
cp .env.example .env   # si présent — configurer Supabase, etc.
npm run dev
```

Mobile : `npm run mobile:start`

## Documentation

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** — variables d’environnement, rôles JWT (`app_role`), CORS, rate limiting.
- **[MOBILE_RUNBOOK_WINDOWS.md](./MOBILE_RUNBOOK_WINDOWS.md)** — lancement Expo Go iOS/Android et depannage Windows.
- **[QA_CHECKLIST_RELEASE.md](./QA_CHECKLIST_RELEASE.md)** — controle rapide avant release.
- **[RAILWAY_COMMANDS.md](./RAILWAY_COMMANDS.md)** — commandes Railway usuelles.
- **[REORG_ROADMAP.md](./REORG_ROADMAP.md)** — plan de migration front propre.

## Tests

```bash
npm test
```

## UI v0

```bash
npm run ui:v0
```
