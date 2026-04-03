# QA Checklist Release (10 minutes)

## A. Serveur/API

- `GET /api/test` retourne `success=true`.
- `GET /api/projets` fonctionne avec un compte gestionnaire.
- `GET /api/rapport/projet/:id` charge bien panneaux + photos.

## B. Mobile

- Login normal + mode demo fonctionnent.
- Navigation roles (gestionnaire/agent/reporting) fonctionnelle.
- Dashboard/mes campagnes chargent sans freeze majeur.
- Upload panneau et synchro offline/online fonctionnent.

## C. PDF

- Generation `default`, `a`, `b`, `c`, `waouh` OK.
- `pdf-url` renvoie la variante utilisee.
- Couverture/resume/zones/closing s'affichent sans map pour les variants v0.
- Sur 2 campagnes reelles: verifier photos face A/B sur plusieurs panneaux.

## D. Regression UI

- Barre de navigation mobile visible (safe area).
- Etats d'erreur et retry coherents.
- Aucune erreur bloquante dans logs Metro et backend.
