create extension if not exists pgcrypto;

alter table if exists public.system_users
  add column if not exists password_hash text;

alter table if exists public.system_users
  alter column password drop not null;

update public.system_users
set
  password_hash = crypt(password, gen_salt('bf', 12)),
  password = null
where coalesce(trim(password_hash), '') = ''
  and coalesce(trim(password), '') <> '';

alter table if exists public.system_users enable row level security;

revoke all on public.system_users from anon, authenticated;

comment on column public.system_users.password_hash is 'bcrypt password hash managed by edu-gateway';
comment on column public.system_users.password is 'legacy plaintext column retained only for migration compatibility; keep null after hardening';
comment on table public.system_users is 'Managed by Edge Function only after password hardening. Browser direct access should remain disabled.';
