-- Migration 005: Drop the legacy password_display column
-- Safe to run after the application and gateway no longer read/write password_display.

ALTER TABLE public.system_users
  DROP COLUMN IF EXISTS password_display;

ALTER TABLE public.system_users_staging
  DROP COLUMN IF EXISTS password_display;

COMMENT ON TABLE public.system_users IS
  'Account table managed by Cloudflare D1 gateway. Password status is derived at runtime from password_hash/has_password; password_display has been removed.';
