# Variantes PDF (v0 → Handlebars)

Quatre mises en page **sans carte** : pages couverture, résumé, zones (panneaux + photos), clôture.

| Variante | Style |
|----------|--------|
| `a` | Editorial minimal |
| `b` | Corporate bold (fond sombre couverture / clôture) |
| `c` | Premium sobre (noir & papier) |
| `waouh` | WAOUH AGENCE (premium client) |

## Activation

1. **Par campagne (recommandé)** : champ projet `reportPdfVariant` = `default` | `a` | `b` | `c` | `waouh`  
   — choisi dans l’app mobile (création / édition campagne, écran « Personnaliser rapport ») et stocké en base (`report_pdf_variant`).

2. **Fallback serveur** : si la campagne est en `default`, la variable d’environnement peut forcer un modèle :

```bash
REPORT_PDF_VARIANT=a   # ou b, c, waouh
```

Sinon : template historique dans `templates/report/`.

## Données projet (optionnel)

Champs reconnus sur le **projet** pour personnaliser textes PDF :

- `footerBrand`, `footerNote`
- `closingHeading`, `closingBody`, `closingSignatureLabel`, `closingSignatureValue`
- `clientDisplay` est dérivé de `entreprise` (nom seul sous « Client »)

La couleur d’accent vient de `couleurPrincipale` (comme le template par défaut).

## Fichiers

Chaque variante : `body.hbs`, `print.css`, `partials/*.hbs`.
