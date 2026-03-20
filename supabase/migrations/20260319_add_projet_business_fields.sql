alter table if exists public.projets
add column if not exists duree text,
add column if not exists instructions text,
add column if not exists client_logo_url text,
add column if not exists entreprise_logo_url text,
add column if not exists couleur_principale text,
add column if not exists titre_rapport text,
add column if not exists assigned_agent text;
