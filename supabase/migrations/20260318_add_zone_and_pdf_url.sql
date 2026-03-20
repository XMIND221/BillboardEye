alter table if exists public.projets
add column if not exists zone text;

alter table if exists public.panneaux
add column if not exists pdf_url text;
