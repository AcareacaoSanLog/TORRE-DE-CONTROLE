create table if not exists public.dashboard_allowed_users (
  email text primary key,
  created_at timestamptz not null default now()
);

create table if not exists public.dashboard_state (
  id text primary key,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.dashboard_allowed_users enable row level security;
alter table public.dashboard_state enable row level security;

drop policy if exists "dashboard_allowed_users_self_read" on public.dashboard_allowed_users;
drop policy if exists "dashboard_state_public_read" on public.dashboard_state;
drop policy if exists "dashboard_state_public_insert" on public.dashboard_state;
drop policy if exists "dashboard_state_public_update" on public.dashboard_state;
drop policy if exists "dashboard_state_team_read" on public.dashboard_state;
drop policy if exists "dashboard_state_team_insert" on public.dashboard_state;
drop policy if exists "dashboard_state_team_update" on public.dashboard_state;

create policy "dashboard_allowed_users_self_read"
on public.dashboard_allowed_users
for select
to authenticated
using (lower(email) = lower(auth.jwt() ->> 'email'));

create policy "dashboard_state_team_read"
on public.dashboard_state
for select
to authenticated
using (
  id = 'torre-controle-txf-latest'
  and exists (
    select 1
    from public.dashboard_allowed_users u
    where lower(u.email) = lower(auth.jwt() ->> 'email')
  )
);

create policy "dashboard_state_team_insert"
on public.dashboard_state
for insert
to authenticated
with check (
  id = 'torre-controle-txf-latest'
  and exists (
    select 1
    from public.dashboard_allowed_users u
    where lower(u.email) = lower(auth.jwt() ->> 'email')
  )
);

create policy "dashboard_state_team_update"
on public.dashboard_state
for update
to authenticated
using (
  id = 'torre-controle-txf-latest'
  and exists (
    select 1
    from public.dashboard_allowed_users u
    where lower(u.email) = lower(auth.jwt() ->> 'email')
  )
)
with check (
  id = 'torre-controle-txf-latest'
  and exists (
    select 1
    from public.dashboard_allowed_users u
    where lower(u.email) = lower(auth.jwt() ->> 'email')
  )
);

revoke all on public.dashboard_state from anon;
revoke all on public.dashboard_allowed_users from anon;

grant usage on schema public to authenticated;
grant select, insert, update on public.dashboard_state to authenticated;
grant select on public.dashboard_allowed_users to authenticated;

-- Depois de rodar este script, crie os usuários em Authentication > Users.
-- Em seguida, libere cada e-mail da equipe com uma linha assim:
-- insert into public.dashboard_allowed_users (email)
-- values ('email.da.equipe@empresa.com')
-- on conflict (email) do nothing;

insert into public.dashboard_allowed_users (email)
values ('acareacao2000@gmail.com')
on conflict (email) do nothing;
