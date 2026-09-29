create extension if not exists pgcrypto;

create table if not exists public.instagram_connections (
  id uuid primary key default gen_random_uuid(),
  singleton_key text not null unique default 'primary',
  ig_user_id text not null,
  username text not null,
  access_token_enc text not null,
  token_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  caption text not null,
  media_url text not null,
  alt_text text,
  status text not null default 'draft' check (status in ('draft','approved','publishing','published','failed')),
  ig_container_id text,
  ig_media_id text,
  error_message text,
  created_at timestamptz not null default now(),
  published_at timestamptz
);

alter table public.instagram_connections enable row level security;
alter table public.posts enable row level security;

-- O app usa somente a Service Role no servidor. Não crie policies públicas para esses dados.

insert into storage.buckets (id, name, public)
values ('post-media', 'post-media', true)
on conflict (id) do update set public = true;
