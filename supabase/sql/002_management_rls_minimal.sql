alter table public.config_alias_rules enable row level security;
alter table public.import_mapping_rules enable row level security;
alter table public.import_logs enable row level security;
alter table public.warning_records enable row level security;
alter table public.rectify_tasks enable row level security;
alter table public.rectify_logs enable row level security;
alter table public.snapshot_versions enable row level security;
alter table public.audit_logs enable row level security;

revoke all on public.config_alias_rules from anon, authenticated;
revoke all on public.import_mapping_rules from anon, authenticated;
revoke all on public.import_logs from anon, authenticated;
revoke all on public.warning_records from anon, authenticated;
revoke all on public.rectify_tasks from anon, authenticated;
revoke all on public.rectify_logs from anon, authenticated;
revoke all on public.snapshot_versions from anon, authenticated;
revoke all on public.audit_logs from anon, authenticated;

comment on table public.config_alias_rules is 'Managed by Edge Function only. Browser direct access disabled by RLS.';
comment on table public.import_mapping_rules is 'Managed by Edge Function only. Browser direct access disabled by RLS.';
comment on table public.import_logs is 'Managed by Edge Function only. Browser direct access disabled by RLS.';
comment on table public.warning_records is 'Managed by Edge Function only. Browser direct access disabled by RLS.';
comment on table public.rectify_tasks is 'Managed by Edge Function only. Browser direct access disabled by RLS.';
comment on table public.rectify_logs is 'Managed by Edge Function only. Browser direct access disabled by RLS.';
comment on table public.snapshot_versions is 'Managed by Edge Function only. Browser direct access disabled by RLS.';
comment on table public.audit_logs is 'Managed by Edge Function only. Browser direct access disabled by RLS.';
