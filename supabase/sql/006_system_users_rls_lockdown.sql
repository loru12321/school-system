alter table if exists public.system_users enable row level security;
alter table if exists public.system_users_staging enable row level security;

revoke all on public.system_users from anon, authenticated;
revoke all on public.system_users_staging from anon, authenticated;

comment on table public.system_users is 'Managed by Edge Function only. Browser direct access disabled by RLS.';
comment on table public.system_users_staging is 'Managed by migration tooling and Edge Function only. Browser direct access disabled by RLS.';
