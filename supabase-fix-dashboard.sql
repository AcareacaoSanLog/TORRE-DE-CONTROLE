-- FIX SUPABASE - TORRE DE CONTROLE TXF
-- Rode este script no Supabase: SQL Editor > New query > Run
-- Depois confira se o e-mail usado no login existe em dashboard_allowed_users.

-- 1) Tabelas principais
create table if not exists public.dashboard_allowed_users (
  email text primary key,
  created_at timestamptz not null default now()
);

create table if not exists public.dashboard_state (
  id text primary key,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- 2) Usuários liberados
-- IMPORTANTE: mantenha aqui o(s) e-mail(s) que realmente fazem login no dashboard.
insert into public.dashboard_allowed_users (email)
values
  ('acareacao2000@gmail.com'),
  ('torrede.controle_txf@sanlog.com')
on conflict (email) do nothing;

-- 3) RLS ligado nas tabelas expostas
alter table public.dashboard_allowed_users enable row level security;
alter table public.dashboard_state enable row level security;

-- 4) Remove políticas antigas
-- Algumas versões anteriores usavam função SECURITY DEFINER. Este fix remove essa necessidade.
drop policy if exists "dashboard_allowed_users_self_read" on public.dashboard_allowed_users;
drop policy if exists "dashboard_state_public_read" on public.dashboard_state;
drop policy if exists "dashboard_state_public_insert" on public.dashboard_state;
drop policy if exists "dashboard_state_public_update" on public.dashboard_state;
drop policy if exists "dashboard_state_team_read" on public.dashboard_state;
drop policy if exists "dashboard_state_team_insert" on public.dashboard_state;
drop policy if exists "dashboard_state_team_update" on public.dashboard_state;

-- 5) Remove/restringe funções antigas que geravam alerta no Security Advisor
revoke execute on function public.is_dashboard_user() from public, anon, authenticated;
drop function if exists public.is_dashboard_user();

-- Se esta função foi criada em teste anterior e não tem dependências, será removida.
-- Se der erro por dependência, pare aqui e me mande o erro antes de usar CASCADE.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
drop function if exists public.rls_auto_enable();

-- 6) Permissões por tabela
revoke all on public.dashboard_state from anon;
revoke all on public.dashboard_allowed_users from anon;

grant usage on schema public to authenticated;
grant select on public.dashboard_allowed_users to authenticated;
grant select, insert, update on public.dashboard_state to authenticated;

-- 7) Política: usuário logado só consegue ler o próprio cadastro de liberação
create policy "dashboard_allowed_users_self_read"
on public.dashboard_allowed_users
for select
to authenticated
using (lower(email) = lower(auth.email()));

-- 8) Políticas da nuvem do dashboard sem SECURITY DEFINER
-- O dashboard só usa o registro id='torre-controle-txf-latest'.
create policy "dashboard_state_team_read"
on public.dashboard_state
for select
to authenticated
using (
  id = 'torre-controle-txf-latest'
  and exists (
    select 1
    from public.dashboard_allowed_users u
    where lower(u.email) = lower(auth.email())
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
    where lower(u.email) = lower(auth.email())
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
    where lower(u.email) = lower(auth.email())
  )
)
with check (
  id = 'torre-controle-txf-latest'
  and exists (
    select 1
    from public.dashboard_allowed_users u
    where lower(u.email) = lower(auth.email())
  )
);
