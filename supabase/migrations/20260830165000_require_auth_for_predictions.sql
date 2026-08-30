revoke select, insert on public.predictions from anon;
grant select, insert on public.predictions to authenticated;

drop policy if exists "guest can insert predictions" on public.predictions;
drop policy if exists "guest can read predictions" on public.predictions;
drop policy if exists "users can insert their own predictions" on public.predictions;

create policy "users can insert their own predictions"
  on public.predictions
  for insert
  to authenticated
  with check (
    simulation_count between 1 and 100
    and source in ('predicts', 'races')
    and user_id = auth.uid()
  );

drop policy if exists "users can read their own future predictions" on public.predictions;
create policy "users can read their own future predictions"
  on public.predictions
  for select
  to authenticated
  using (user_id = auth.uid());

comment on table public.predictions is
  'Stores authenticated user F1 ML race prediction simulations.';

comment on column public.predictions.user_id is
  'Supabase Auth user that owns the prediction.';
