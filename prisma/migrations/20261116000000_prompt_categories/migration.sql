BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[PromptCategory] (
    [promptId] NVARCHAR(36) NOT NULL,
    [categoryId] NVARCHAR(36) NOT NULL,
    CONSTRAINT [PromptCategory_pkey] PRIMARY KEY CLUSTERED ([promptId],[categoryId])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [PromptCategory_categoryId_promptId_idx] ON [dbo].[PromptCategory]([categoryId], [promptId]);

-- AddForeignKey
ALTER TABLE [dbo].[PromptCategory] ADD CONSTRAINT [PromptCategory_promptId_fkey] FOREIGN KEY ([promptId]) REFERENCES [dbo].[Prompt]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[PromptCategory] ADD CONSTRAINT [PromptCategory_categoryId_fkey] FOREIGN KEY ([categoryId]) REFERENCES [dbo].[Category]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Copy the single Category each Prompt had.
INSERT INTO [dbo].[PromptCategory] ([promptId], [categoryId]) SELECT [id], [categoryId] FROM [dbo].[Prompt];

-- Abort (rolling everything back) unless every Prompt kept exactly its Category.
IF (SELECT COUNT(*) FROM [dbo].[Prompt]) <> (SELECT COUNT(*) FROM [dbo].[PromptCategory])
    THROW 50000, N'Prompt categories were not copied correctly; migration aborted.', 1;

-- DropForeignKey
ALTER TABLE [dbo].[Prompt] DROP CONSTRAINT [Prompt_categoryId_fkey];

-- DropIndex
DROP INDEX [Prompt_categoryId_createdAt_id_idx] ON [dbo].[Prompt];

-- AlterTable
ALTER TABLE [dbo].[Prompt] DROP COLUMN [categoryId];

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
