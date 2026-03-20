create extension if not exists pgcrypto;

alter table public.photos
alter column id set default gen_random_uuid()::text;

alter table public.photos
alter column "createdAt" set default now();
