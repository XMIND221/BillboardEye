create table if not exists public.projets (
  id text primary key,
  nom text not null,
  entreprise text not null,
  date timestamp with time zone not null default now()
);

alter table public.panneaux
add column if not exists projet_id text;

alter table public.panneaux
drop constraint if exists panneaux_projet_id_fkey;

alter table public.panneaux
add constraint panneaux_projet_id_fkey
foreign key (projet_id)
references public.projets(id)
on delete set null;

create index if not exists idx_panneaux_projet_id on public.panneaux(projet_id);
