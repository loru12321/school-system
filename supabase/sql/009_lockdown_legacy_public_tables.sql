alter table if exists public.system_data enable row level security;
alter table if exists public.issues enable row level security;
alter table if exists public.system_logs enable row level security;
alter table if exists public.migration_runs enable row level security;

revoke all on public.system_data from anon, authenticated;
revoke all on public.issues from anon, authenticated;
revoke all on public.system_logs from anon, authenticated;
revoke all on public.migration_runs from anon, authenticated;

comment on table public.system_data is 'Legacy Supabase table. Production uses Cloudflare D1/Worker routes; browser direct access disabled by RLS.';
comment on table public.issues is 'Legacy Supabase table. Production uses authenticated Worker routes; browser direct access disabled by RLS.';
comment on table public.system_logs is 'Legacy Supabase table. Production uses authenticated Worker routes; browser direct access disabled by RLS.';
comment on table public.migration_runs is 'Migration audit table. Browser direct access disabled by RLS.';
