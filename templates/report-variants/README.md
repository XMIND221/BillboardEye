# Variantes PDF (v0 → Handlebars)

Trois mises en page **sans carte** : pages couverture, résumé, zones (panneaux + photos), clôture.

| Variante | Style |
|----------|--------|
| `a` | Editorial minimal |
| `b` | Corporate bold (fond sombre couverture / clôture) |
| `c` | Premium sobre (noir & papier) |

## Activation

Variable d’environnement :

```bash
REPORT_PDF_VARIANT=a   # ou b, c
```

Sans variable ou `default` : template historique dans `templates/report/`.

## Données projet (optionnel)

Champs reconnus sur le **projet** pour personnaliser textes PDF :

- `footerBrand`, `footerNote`
- `closingHeading`, `closingBody`, `closingSignatureLabel`, `closingSignatureValue`
- `clientDisplay` est dérivé de `entreprise` (nom seul sous « Client »)

La couleur d’accent vient de `couleurPrincipale` (comme le template par défaut).

## Fichiers

Chaque variante : `body.hbs`, `print.css`, `partials/*.hbs`.
