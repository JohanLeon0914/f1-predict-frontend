create extension if not exists pgcrypto;

create table if not exists public.ufc_predictions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  guest_id text,
  user_id uuid references auth.users(id) on delete set null,
  source text not null default 'ufc' check (source = 'ufc'),
  event_id text,
  event_name text,
  fight_id text,
  fight_key text not null,
  fight_name text,
  request_payload jsonb not null,
  prediction_payload jsonb not null,
  model_version text,
  api_base_url text,
  client_metadata jsonb not null default '{}'::jsonb
);

create index if not exists ufc_predictions_created_at_idx
  on public.ufc_predictions (created_at desc);

create index if not exists ufc_predictions_user_id_created_at_idx
  on public.ufc_predictions (user_id, created_at desc);

create index if not exists ufc_predictions_fight_key_idx
  on public.ufc_predictions (fight_key, created_at desc);

alter table public.ufc_predictions enable row level security;

grant select, insert on public.ufc_predictions to authenticated;

drop policy if exists "users can insert their own ufc predictions" on public.ufc_predictions;
create policy "users can insert their own ufc predictions"
  on public.ufc_predictions
  for insert
  to authenticated
  with check (
    source = 'ufc'
    and user_id = auth.uid()
  );

drop policy if exists "users can read their own ufc predictions" on public.ufc_predictions;
create policy "users can read their own ufc predictions"
  on public.ufc_predictions
  for select
  to authenticated
  using (user_id = auth.uid());
