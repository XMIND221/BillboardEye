-- Nom de zone défini par le gestionnaire (distinct de l'adresse / repère terrain)
alter table if exists public.panneaux
add column if not exists nom_zone text;

comment on column public.panneaux.nom_zone is 'Libellé zone campagne (ex. zones saisies par le manager)';
