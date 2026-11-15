-- One-time setup of the throwaway database used by `npm run test:integration`.
-- Run as a SQL Server administrator, e.g.:
--   sqlcmd -S "localhost,1433" -E -C -i tests/integration/provision.sql
-- It reuses the existing server logins and mirrors SECURITY.md §6:
--   promptify_migrator: DDL (db_owner). promptify_app: only SELECT/INSERT/UPDATE/DELETE.
IF DB_ID(N'promptify_integration') IS NULL CREATE DATABASE promptify_integration;
GO
USE promptify_integration;
GO
IF USER_ID(N'promptify_migrator') IS NULL CREATE USER promptify_migrator FOR LOGIN promptify_migrator;
IF USER_ID(N'promptify_app') IS NULL CREATE USER promptify_app FOR LOGIN promptify_app;
ALTER ROLE db_owner ADD MEMBER promptify_migrator;
GRANT SELECT, INSERT, UPDATE, DELETE ON SCHEMA::dbo TO promptify_app;
GO
