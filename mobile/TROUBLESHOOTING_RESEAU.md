# Réseau

## Usage normal

Sans variable `EXPO_PUBLIC_API_BASE_URL`, l’app appelle **l’API Railway** déjà configurée dans le code.  
Il suffit de :

```bash
npx expo start -c
```

Pense à avoir un **`.env`** avec au moins **Supabase** (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`). Voir `.env.example`.

## API sur ton PC

Uniquement si tu lances l’API en local :

```
EXPO_PUBLIC_API_BASE_URL=http://localhost:5000/api
```

L’app remplace `localhost` automatiquement (émulateur → `10.0.2.2`, téléphone → IP souvent déduite d’Expo). Sinon définis `EXPO_PUBLIC_LOCAL_IP`.

## Détail Metro

En dev, la console affiche `[BillboardEye] API = …` avec l’URL réelle.
