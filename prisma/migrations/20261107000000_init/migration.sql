BEGIN TRY

BEGIN TRAN;

-- CreateSchema
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = N'dbo') EXEC sp_executesql N'CREATE SCHEMA [dbo];';

-- CreateTable
CREATE TABLE [dbo].[User] (
    [oid] NVARCHAR(36) NOT NULL,
    [displayName] NVARCHAR(200) NOT NULL,
    [isAdministrator] BIT NOT NULL CONSTRAINT [User_isAdministrator_df] DEFAULT 0,
    CONSTRAINT [User_pkey] PRIMARY KEY CLUSTERED ([oid])
);

-- CreateTable
CREATE TABLE [dbo].[Category] (
    [id] NVARCHAR(36) NOT NULL,
    [name] NVARCHAR(50) NOT NULL,
    [color] CHAR(7) NOT NULL,
    CONSTRAINT [Category_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Category_name_key] UNIQUE NONCLUSTERED ([name])
);

-- CreateTable
CREATE TABLE [dbo].[Prompt] (
    [id] NVARCHAR(36) NOT NULL,
    [title] NVARCHAR(120) NOT NULL,
    [content] NVARCHAR(max) NOT NULL,
    [description] NVARCHAR(500),
    [categoryId] NVARCHAR(36) NOT NULL,
    [authorOid] NVARCHAR(36) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Prompt_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Prompt_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Prompt_createdAt_id_idx] ON [dbo].[Prompt]([createdAt] DESC, [id] DESC);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Prompt_categoryId_createdAt_id_idx] ON [dbo].[Prompt]([categoryId], [createdAt] DESC, [id] DESC);

-- AddForeignKey
ALTER TABLE [dbo].[Prompt] ADD CONSTRAINT [Prompt_categoryId_fkey] FOREIGN KEY ([categoryId]) REFERENCES [dbo].[Category]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Prompt] ADD CONSTRAINT [Prompt_authorOid_fkey] FOREIGN KEY ([authorOid]) REFERENCES [dbo].[User]([oid]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH

