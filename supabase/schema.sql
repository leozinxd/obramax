create table if not exists public.app_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  state jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.app_state enable row level security;

revoke all on public.app_state from anon, authenticated;
grant select, insert, update on public.app_state to authenticated;

drop policy if exists "Users can access their own app state" on public.app_state;
create policy "Users can access their own app state"
  on public.app_state
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);