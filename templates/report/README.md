# Rapport campagne (PDF)

## Fichiers utilisés par l’API

| Fichier | Rôle |
|--------|------|
| `report.html` | Squelette : `@@DOC_TITLE@@`, `@@PRINT_CSS@@`, `@@REPORT_INNER@@` |
| `body.hbs` | Assemblage des pages (Handlebars) |
| `partials/*.hbs` | **Contenu éditable dans l’éditeur** : couverture, résumé, zones, carte, footer, visuel |
| `print.css` | Styles print / A4 |

Les **textes et la structure HTML** du rapport se modifient surtout dans `partials/` et `body.hbs`.  
Les **données** (chiffres, photos, URL carte) sont injectées par `src/services/report-template.service.js` (variables Handlebars : `campaignName`, `zonesCount`, `mapImageUrl`, `zones`, etc.).

## Données

- Construction du contexte : `src/services/map-report-payload.js` (`buildMapReportContext`).
- **Nom de zone affiché** : `panneaux.nom_zone` (API `nomZone`) si renseigné, sinon `localisation.adresse`.
- **Logos couverture** : `projet.clientLogoUrl` / `projet.entrepriseLogoUrl` (URLs publiques Supabase `panneaux-images/logos/…`) — téléchargées en data URI dans `report-template.service.js`. À la **création** (`POST /api/projets`), l’API accepte aussi des **`data:image/...;base64,...`** dans `clientLogoUrl` / `entrepriseLogoUrl` (ou `clientLogoDataUri` / `entrepriseLogoDataUri`) et **upload automatiquement** vers le bucket ; l’app mobile envoie le base64 depuis le picker (repli `POST /upload/logo` si base64 indisponible).
- Carte : `MAPBOX_ACCESS_TOKEN` + **un pin numéroté par panneau** (même numéro que les fiches 01, 02…). Sans GPS réel, le pin est placé en **position indicative** autour du centroïde des autres points (ou centre France si aucun GPS). La **légende** sous l’image précise « sur la carte (GPS) » vs « position indicative ».
- Compteurs résumé : `zonesCount` / `panneaux actifs` = **`panneaux.length`** du rapport (aligné avec les pins).

Migration Supabase : `20260323_panneaux_nom_zone.sql` (colonne `nom_zone`).

## Référence design v0

Le dossier `v0-reference/types.ts` reprend les types du zip v0. Les sources React complètes du zip peuvent être conservées localement hors repo ; ne pas les mélanger avec `admin/` ou `mobile/`.

## Renderer Next (optionnel)

Pour réutiliser l’ancien flux Next + Puppeteer sur URL, définir `NEXT_PDF_RENDERER_FIRST=true`. Par défaut, l’API utilise **uniquement** ce dossier + Puppeteer.
