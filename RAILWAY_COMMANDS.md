# Commandes Railway (habituelles)

## 1) Login et lien projet

```cmd
railway login
railway link
```

## 2) Variables (si besoin)

```cmd
railway variables
```

## 3) Deploy

```cmd
railway up
```

## 4) Logs runtime

```cmd
railway logs
```

## 5) Verif rapide post-deploy

- Healthcheck: `GET /api/test`
- PDF URL: `GET /api/rapport/projet/:id/pdf-url?reportPdfVariant=waouh`

## Notes

- Le projet utilise `railway.json` + `Dockerfile`.
- Appliquer les migrations Supabase avant release quand schema modifie.
