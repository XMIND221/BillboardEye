-- Anciennes campagnes : logos enregistrés en file:// ou chemins locaux (non utilisables par l’API / le PDF).
-- On remet à NULL pour éviter des champs « fantômes » ; l’API filtre aussi à la lecture.

update projets
set client_logo_url = null
where client_logo_url is not null
  and btrim(client_logo_url) <> ''
  and client_logo_url !~* '^https?://';

update projets
set entreprise_logo_url = null
where entreprise_logo_url is not null
  and btrim(entreprise_logo_url) <> ''
  and entreprise_logo_url !~* '^https?://';
