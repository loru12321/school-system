-- Migration 004: Drop the legacy plaintext password column
-- Safe to run only after 003_system_users_password_hardening.sql has been applied
-- and all rows have password = NULL (verified by the assert below).

-- Safety check: abort if any row still has a non-null password value.
-- PostgreSQL will raise an exception and roll back if the count is > 0.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.system_users
    WHERE password IS NOT NULL AND trim(coalesce(password, '')) <> ''
    LIMIT 1
  ) THEN
    RAISE EXCEPTION
      'ABORT: public.system_users still has non-null password values. '
      'Run 003_system_users_password_hardening.sql first and verify all rows are migrated.';
  END IF;
END $$;

-- Drop the legacy plaintext column now that all passwords are hashed.
ALTER TABLE public.system_users DROP COLUMN IF EXISTS password;

COMMENT ON TABLE public.system_users IS
  'Account table managed by Cloudflare D1 gateway. '
  'Passwords are stored as PBKDF2-SHA256 hashes in password_hash only. '
  'The legacy plaintext password column has been removed (migration 004).';
