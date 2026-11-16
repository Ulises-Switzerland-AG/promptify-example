-- Local development provisioning. Run by scripts/setup-local.ps1 as a SQL Server administrator (sqlcmd -v ...).
-- Mirrors SECURITY.md: promptify_migrator = DDL (db_owner); promptify_app = SELECT/INSERT/UPDATE/DELETE only.
-- Idempotent: safe to run repeatedly (passwords are re-synchronised with the values written to .env).
SET NOCOUNT ON;

IF SUSER_ID(N'promptify_migrator') IS NULL
  CREATE LOGIN promptify_migrator WITH PASSWORD = N'$(MigratorPassword)', CHECK_POLICY = OFF;
ELSE
  ALTER LOGIN promptify_migrator WITH PASSWORD = N'$(MigratorPassword)';

IF SUSER_ID(N'promptify_app') IS NULL
  CREATE LOGIN promptify_app WITH PASSWORD = N'$(AppPassword)', CHECK_POLICY = OFF;
ELSE
  ALTER LOGIN promptify_app WITH PASSWORD = N'$(AppPassword)';

IF DB_ID(N'$(Database)') IS NULL CREATE DATABASE [$(Database)];
GO

USE [$(Database)];
GO

IF USER_ID(N'promptify_migrator') IS NULL CREATE USER promptify_migrator FOR LOGIN promptify_migrator;
IF USER_ID(N'promptify_app') IS NULL CREATE USER promptify_app FOR LOGIN promptify_app;
ALTER ROLE db_owner ADD MEMBER promptify_migrator;
GRANT SELECT, INSERT, UPDATE, DELETE ON SCHEMA::dbo TO promptify_app;
GO
