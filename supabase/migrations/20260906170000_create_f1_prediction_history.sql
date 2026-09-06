create table if not exists public.f1_prediction_history (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  prediction_date timestamptz not null,
  race_id integer not null,
  circuit_id integer not null,
  race_name text not null,
  race_date date not null,
  model_name text not null default 'GRDX1 F1 ranker',
  model_version text,
  simulation_count integer not null default 1 check (
    simulation_count >= 1 and simulation_count <= 100
  ),
  input_data_status text not null default 'pre_race' check (
    input_data_status in ('pre_race', 'qualifying_loaded', 'race_result_loaded')
  ),
  qualifying_status text not null default 'pending' check (
    qualifying_status in ('pending', 'partial', 'complete')
  ),
  prediction_payload jsonb not null,
  official_qualifying jsonb,
  official_result jsonb,
  source_note text,
  created_by uuid references auth.users(id) on delete set null
);

create index if not exists f1_prediction_history_race_date_idx
  on public.f1_prediction_history (race_date desc);

create index if not exists f1_prediction_history_race_id_created_at_idx
  on public.f1_prediction_history (race_id, created_at desc);

alter table public.f1_prediction_history enable row level security;

grant select on public.f1_prediction_history to anon, authenticated;
grant insert, update on public.f1_prediction_history to authenticated;

drop policy if exists "anyone can read f1 prediction history" on public.f1_prediction_history;
create policy "anyone can read f1 prediction history"
  on public.f1_prediction_history
  for select
  using (true);

drop policy if exists "authenticated users can add f1 prediction history" on public.f1_prediction_history;
create policy "authenticated users can add f1 prediction history"
  on public.f1_prediction_history
  for insert
  to authenticated
  with check (created_by = auth.uid());

drop policy if exists "authenticated users can update their f1 prediction history" on public.f1_prediction_history;
create policy "authenticated users can update their f1 prediction history"
  on public.f1_prediction_history
  for update
  to authenticated
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

comment on table public.f1_prediction_history is
  'Public archive of model predictions by F1 race, with qualifying and result snapshots for later accuracy review.';
