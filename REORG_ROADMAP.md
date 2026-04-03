# Reorganisation App (propre, fluide, progressive)

## Objectif

Migrer vers une architecture par domaine sans big-bang ni regression.

## Etapes

1. Consolider les imports via `mobile/src/features/*`.
2. Migrer les ecrans manager (dashboard/campagnes/panneaux/reporting).
3. Migrer les ecrans agent (missions/zone/execution/panneaux).
4. Regrouper services par domaine derriere des barrels.
5. Uniformiser les hooks de chargement (`useFocusRefresh`) et etats d'erreur.
6. Supprimer les anciens chemins quand plus aucune reference.

## Regles

- Changement progressif par lot testable.
- Pas de deplacement massif sans verifier navigation.
- Lint + QA checklist apres chaque lot.
