-- Local test data. Run by scripts/setup-local.ps1 with the runtime login (promptify_app) after migrations and the first-administrator seed.
-- Idempotent: rows are matched by natural key (oid, Category name, Prompt title) and never duplicated.
-- Variables: $(AdminOid), $(AdminName).
SET NOCOUNT ON;

DECLARE @users TABLE (oid NVARCHAR(36), displayName NVARCHAR(200));
INSERT INTO @users VALUES
  (N'$(AdminOid)', N'$(AdminName)'),
  (N'11111111-1111-4111-8111-111111111111', N'Ana Garcia'),
  (N'22222222-2222-4222-8222-222222222222', N'Marc Puig'),
  (N'33333333-3333-4333-8333-333333333333', N'Laura Meier');

INSERT INTO [dbo].[User] (oid, displayName)
SELECT u.oid, u.displayName FROM @users u
WHERE NOT EXISTS (SELECT 1 FROM [dbo].[User] x WHERE x.oid = u.oid);

DECLARE @categories TABLE (name NVARCHAR(50), color CHAR(7));
INSERT INTO @categories VALUES
  (N'Writing', '#2563EB'),
  (N'Code', '#16A34A'),
  (N'Marketing', '#DB2777'),
  (N'Data analysis', '#EA580C'),
  (N'Support', '#7C3AED');

INSERT INTO [dbo].[Category] (id, name, color)
SELECT LOWER(CONVERT(NVARCHAR(36), NEWID())), c.name, c.color FROM @categories c
WHERE NOT EXISTS (SELECT 1 FROM [dbo].[Category] x WHERE x.name = c.name);

DECLARE @prompts TABLE (title NVARCHAR(120), description NVARCHAR(500), content NVARCHAR(MAX), category NVARCHAR(50), authorOid NVARCHAR(36));
INSERT INTO @prompts VALUES
  (N'Summarise a long email', N'Condenses an email thread into key points.',
   N'Summarise the following email thread in at most five bullet points. Highlight decisions taken and open questions.' + NCHAR(10) + NCHAR(10) + N'{{email}}',
   N'Writing', N'11111111-1111-4111-8111-111111111111'),
  (N'Rewrite in a friendly tone', N'Softens the tone of a message without losing the content.',
   N'Rewrite the following text in a warm, professional tone. Keep it under 120 words.' + NCHAR(10) + NCHAR(10) + N'{{text}}',
   N'Writing', N'22222222-2222-4222-8222-222222222222'),
  (N'Explain this code', N'Line-by-line explanation for newcomers.',
   N'Explain what the following code does, step by step, as if to a junior developer. Mention any bugs you notice.' + NCHAR(10) + NCHAR(10) + N'{{code}}',
   N'Code', N'$(AdminOid)'),
  (N'Write unit tests', N'Generates tests for a function following Red-Green-Refactor.',
   N'Write unit tests for the following function. Cover the happy path, edge cases and error handling. Use Vitest.' + NCHAR(10) + NCHAR(10) + N'{{function}}',
   N'Code', N'33333333-3333-4333-8333-333333333333'),
  (N'Review a pull request', NULL,
   N'Review the following diff. List bugs first, then risks, then style remarks. Be concise.' + NCHAR(10) + NCHAR(10) + N'{{diff}}',
   N'Code', N'11111111-1111-4111-8111-111111111111'),
  (N'Product launch announcement', N'Short announcement for a newsletter or intranet post.',
   N'Write a 150-word announcement for the launch of {{product}}. Audience: {{audience}}. End with a clear call to action.',
   N'Marketing', N'22222222-2222-4222-8222-222222222222'),
  (N'Generate five slogans', N'Quick brainstorming of campaign slogans.',
   N'Suggest five short, memorable slogans for {{campaign}}. Vary the tone: playful, serious, bold, minimal, emotional.',
   N'Marketing', N'$(AdminOid)'),
  (N'Describe a dataset', N'First look at an unknown table.',
   N'Given this sample of a dataset, describe each column, detect likely data quality issues and suggest three useful analyses.' + NCHAR(10) + NCHAR(10) + N'{{sample}}',
   N'Data analysis', N'33333333-3333-4333-8333-333333333333'),
  (N'Write a SQL query from a question', N'Natural language to T-SQL.',
   N'Translate this question into a T-SQL query for SQL Server. Explain assumptions about the schema.' + NCHAR(10) + NCHAR(10) + N'Schema: {{schema}}' + NCHAR(10) + N'Question: {{question}}',
   N'Data analysis', N'11111111-1111-4111-8111-111111111111'),
  (N'Reply to an angry customer', N'De-escalation template for support tickets.',
   N'Write a calm, empathetic reply to the following customer message. Acknowledge the problem, apologise once, propose next steps.' + NCHAR(10) + NCHAR(10) + N'{{message}}',
   N'Support', N'22222222-2222-4222-8222-222222222222'),
  (N'Turn a ticket into a knowledge-base article', N'Reusable how-to from a solved ticket.',
   N'Convert the following solved support ticket into a knowledge-base article with: problem, cause, solution, prevention.' + NCHAR(10) + NCHAR(10) + N'{{ticket}}',
   N'Support', N'$(AdminOid)');

-- Filler rows so lists exceed one page (page size 20) and pagination can be tried locally.
WITH n AS (
  SELECT TOP (25) ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS i FROM sys.all_objects
)
INSERT INTO @prompts
SELECT
  N'Sample prompt ' + RIGHT(N'00' + CAST(i AS NVARCHAR(3)), 2),
  N'Generated filler prompt used to exercise pagination.',
  N'This is the body of sample prompt number ' + CAST(i AS NVARCHAR(3)) + N'. Replace {{topic}} with your own topic.',
  CHOOSE((i % 5) + 1, N'Writing', N'Code', N'Marketing', N'Data analysis', N'Support'),
  CHOOSE((i % 4) + 1, N'$(AdminOid)', N'11111111-1111-4111-8111-111111111111', N'22222222-2222-4222-8222-222222222222', N'33333333-3333-4333-8333-333333333333')
FROM n;

-- Spread creation dates so the newest-first ordering is visible. Prisma's @updatedAt has no database default.
DECLARE @now DATETIME2 = SYSUTCDATETIME();

INSERT INTO [dbo].[Prompt] (id, title, content, description, categoryId, authorOid, createdAt, updatedAt)
SELECT
  LOWER(CONVERT(NVARCHAR(36), NEWID())),
  p.title,
  p.content,
  p.description,
  c.id,
  p.authorOid,
  DATEADD(HOUR, -ROW_NUMBER() OVER (ORDER BY p.title), @now),
  DATEADD(HOUR, -ROW_NUMBER() OVER (ORDER BY p.title), @now)
FROM @prompts p
JOIN [dbo].[Category] c ON c.name = p.category
WHERE NOT EXISTS (SELECT 1 FROM [dbo].[Prompt] x WHERE x.title = p.title);

SELECT
  (SELECT COUNT(*) FROM [dbo].[User]) AS users,
  (SELECT COUNT(*) FROM [dbo].[Category]) AS categories,
  (SELECT COUNT(*) FROM [dbo].[Prompt]) AS prompts;
