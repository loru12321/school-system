-- Existing remote D1 cleanup only.
-- Run this once against a D1 database created before password_display was removed
-- from 002_gateway_data.sql and 003_gateway_accounts.sql.

ALTER TABLE system_users DROP COLUMN password_display;

ALTER TABLE system_users_staging DROP COLUMN password_display;
