create extension if not exists citext;

create table if not exists public.premium_users (
  id uuid primary key default gen_random_uuid(),
  email citext not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  notes text
);

create index if not exists premium_users_email_active_idx
  on public.premium_users (email, active);

alter table public.premium_users enable row level security;

grant select on public.premium_users to authenticated;

drop policy if exists "premium users can read their own record" on public.premium_users;
create policy "premium users can read their own record"
  on public.premium_users
  for select
  to authenticated
  using (
    active = true
    and email = lower(auth.jwt() ->> 'email')::citext
    and (expires_at is null or expires_at > now())
  );

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

comment on table public.premium_users is
  'Email allowlist for users without ads and without free prediction limits.';

comment on column public.premium_users.email is
  'Lowercase email from Supabase Auth / Google login.';
