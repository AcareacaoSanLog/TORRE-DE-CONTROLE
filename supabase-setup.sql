create table if not exists public.dashboard_state (
  id text primary key,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.dashboard_state enable row level security;

drop policy if exists "dashboard_state_public_read" on public.dashboard_state;
drop policy if exists "dashboard_state_public_insert" on public.dashboard_state;
drop policy if exists "dashboard_state_public_update" on public.dashboard_state;

create policy "dashboard_state_public_read"
on public.dashboard_state
for select
to anon
using (id in ('torre-controle-txf-latest', 'torre-controle-txf-lh'));

create policy "dashboard_state_public_insert"
on public.dashboard_state
for insert
to anon
with check (id in ('torre-controle-txf-latest', 'torre-controle-txf-lh'));

create policy "dashboard_state_public_update"
on public.dashboard_state
for update
to anon
using (id in ('torre-controle-txf-latest', 'torre-controle-txf-lh'))
with check (id in ('torre-controle-txf-latest', 'torre-controle-txf-lh'));

grant usage on schema public to anon;
grant select, insert, update on public.dashboard_state to anon;
