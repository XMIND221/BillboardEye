-- Textes éditables pour le rapport PDF (template v0)
alter table if exists public.projets
  add column if not exists legende_visuelle text,
  add column if not exists legende_carte text;

comment on column public.projets.legende_visuelle is 'Légende sous la grande photo visuelle du rapport';
comment on column public.projets.legende_carte is 'Légende affichée sur la carte du résumé';
