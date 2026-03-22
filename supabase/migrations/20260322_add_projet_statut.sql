-- Statut de campagne / mission : planned | active | completed | archived
alter table if exists public.projets
  add column if not exists statut text default 'active';

comment on column public.projets.statut is 'planned | active | completed | archived';
