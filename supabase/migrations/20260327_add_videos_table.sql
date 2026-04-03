create table if not exists public.videos (
  id uuid primary key,
  panneau_id uuid not null,
  url text not null,
  created_at timestamptz not null default now()
);

create index if not exists videos_panneau_id_idx on public.videos (panneau_id);
create index if not exists videos_created_at_idx on public.videos (created_at desc);
