create extension if not exists pgcrypto;
create extension if not exists citext;

create table if not exists public.kofi_payments (
  id uuid primary key default gen_random_uuid(),
  message_id text not null unique,
  user_id uuid references auth.users(id) on delete set null,
  email citext,
  amount numeric(12, 2) not null check (amount > 0),
  currency text not null,
  type text not null,
  is_public boolean,
  from_name text,
  timestamp timestamptz not null,
  raw_payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists kofi_payments_user_id_created_at_idx
  on public.kofi_payments (user_id, created_at desc);

create index if not exists kofi_payments_email_created_at_idx
  on public.kofi_payments (email, created_at desc);

create index if not exists kofi_payments_timestamp_idx
  on public.kofi_payments (timestamp desc);

create table if not exists public.user_access (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  access_type text not null,
  source text not null,
  granted_at timestamptz not null default now(),
  expires_at timestamptz,
  external_payment_id text,
  created_at timestamptz not null default now(),
  constraint user_access_type_check
    check (access_type in ('unlimited_f1')),
  constraint user_access_source_check
    check (source in ('kofi_founding_supporter'))
);

create unique index if not exists user_access_user_type_source_uidx
  on public.user_access (user_id, access_type, source);

create index if not exists user_access_user_id_access_type_idx
  on public.user_access (user_id, access_type);

create index if not exists user_access_external_payment_id_idx
  on public.user_access (external_payment_id);

alter table public.kofi_payments enable row level security;
alter table public.user_access enable row level security;

grant select on public.kofi_payments to authenticated;
grant select on public.user_access to authenticated;

drop policy if exists "users can read their own kofi payments" on public.kofi_payments;
create policy "users can read their own kofi payments"
  on public.kofi_payments
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "users can read their own access" on public.user_access;
create policy "users can read their own access"
  on public.user_access
  for select
  to authenticated
  using (user_id = auth.uid());

comment on table public.kofi_payments is
  'Verified Ko-fi webhook payment records. Unmatched emails remain available for later account linking.';

comment on table public.user_access is
  'Application entitlements granted by trusted server-side workflows.';

comment on column public.user_access.access_type is
  'Current launch value: unlimited_f1.';

comment on column public.user_access.source is
  'Current launch value: kofi_founding_supporter.';
