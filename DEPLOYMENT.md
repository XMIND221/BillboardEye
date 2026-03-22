# BillboardEye — déploiement & sécurité

## Variables d’environnement (API Node)

| Variable | Description |
|----------|-------------|
| `NODE_ENV` | `production` en prod |
| `AUTH_REQUIRED` | `true` pour exiger un JWT Supabase sur les routes `/api/*` (sauf `/`, `/auth`, `/internal` selon routes) |
| `PROJET_SCOPE_STRICT` | `true` : sans `user_metadata.app_role`, l’utilisateur est traité comme **agent** (campagnes assignées uniquement). `false` (défaut) : sans rôle, liste complète (rétrocompat). |
| `CORS_ORIGINS` | Liste CSV d’origines autorisées (ex. `https://admin.example.com,https://app.example.com`) |
| `ADMIN_WEB_URL`, `MOBILE_WEB_URL` | Utilisées si `CORS_ORIGINS` est vide (prod) |
| `JSON_BODY_LIMIT` | Taille max du JSON (défaut ~12mb en prod, 50mb en dev) |
| `RATE_LIMIT_*` | Voir `src/middlewares/security.middleware.js` |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Requis côté serveur |
| `MAPBOX_ACCESS_TOKEN` | **Carte du rapport PDF** : image statique avec repères numérotés + légende (API calcule l’URL ; sans token = message « carte non disponible »). |
| `PDF_RENDER_INTERNAL_SECRET` | Secret partagé API ↔ renderer Next (session `/api/internal/pdf-render-session`). |

## Rapport PDF (Handlebars + option Next)

- **Flux principal** : `templates/report/` (Handlebars) + Puppeteer — le dossier doit être présent dans l’image Docker (`COPY . .` à la racine du repo).
- **Renderer Next** (`tmp_v0_template`) : si tu déploies avec le `Dockerfile` du repo, **rebuild l’image** après modification des composants `summary-section` etc. La session PDF est enrichie côté API (`__renderExtras` : `mapImageUrl`, `mapLegend`) pour afficher la **vraie carte Mapbox** et la **correspondance des points** (plus de grille factice à 4 points).

## Rôle métier (JWT)

Définir dans Supabase **User metadata** : `app_role` = `gestionnaire` | `agent` | `reporting`.

L’app mobile synchronise ce champ lors du choix de mode (écran rôle).

- **gestionnaire** : toutes les campagnes, création de campagne.
- **reporting** : toutes les campagnes en lecture, pas de création.
- **agent** : campagnes où `assigned_agent` = email utilisateur, ou champ vide (ouvert à tous les agents).

## Migrations Supabase

Appliquer les fichiers dans `supabase/migrations/`, notamment `20260322_add_projet_statut.sql` et `20260324_clean_invalid_projet_logo_urls.sql` (supprime en base les logos `file://` / non-HTTPS des anciennes campagnes ; l’API filtre aussi à la lecture).

## Nouveau compte Supabase (remplace un ancien utilisateur)

L’app et l’API **ne stockent pas** d’email en dur : tu te connectes avec le **nouvel** email / mot de passe. À faire selon ton cas :

1. **Rôle métier (gestionnaire / agent / reporting)**  
   Dans `.env` : `APP_ROLE_MAP={"nouveau@email.com":"gestionnaire"}` (ou `agent` / `reporting`), puis :
   ```bash
   npm run roles:sync
   ```
   (nécessite `SUPABASE_SERVICE_ROLE_KEY`.)

2. **Campagnes dont le champ « agent assigné » était l’ancien email**  
   Pour mettre à jour `projets.assigned_agent` en masse :
   ```bash
   REMAP_AGENT_FROM=ancien@email.com REMAP_AGENT_TO=nouveau@email.com npm run remap:agent
   ```

3. **Métadonnées à la main** : dans Supabase **Authentication → Users →** ton utilisateur → **User Metadata** : tu peux ajouter `app_role` (`gestionnaire` | `agent` | `reporting`) si tu ne passes pas par `roles:sync`.

## Mobile (Expo)

- `EXPO_PUBLIC_API_BASE_URL` : URL HTTPS de l’API.
- `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` : auth.

## Configuration automatique

Depuis la racine du projet :

```bash
npm run configure:prod
```

Ce script :
- crée / met à jour `.env` avec `NODE_ENV=production`, `AUTH_REQUIRED=true`, `PROJET_SCOPE_STRICT=true`,
- crée / met à jour `mobile/.env` depuis `mobile/.env.example`,
- conserve les valeurs déjà présentes.

## Synchronisation automatique des rôles Supabase

1. Mettre dans `.env` :

```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
APP_ROLE_MAP={"manager@acme.com":"gestionnaire","agent1@acme.com":"agent","report@acme.com":"reporting"}
```

2. Exécuter :

```bash
npm run roles:sync
```
