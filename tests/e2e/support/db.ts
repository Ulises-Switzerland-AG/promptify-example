import { randomUUID } from "node:crypto";
import sql from "mssql";
import { ADMINISTRATOR, AUTHOR, OTHER_USER, type Persona } from "./identity";
import { loadE2eUrls } from "./env";

export const CATEGORY_NAMES = { writing: "E2E Writing", code: "E2E Code", data: "E2E Data" } as const;
export type CategoryKey = keyof typeof CATEGORY_NAMES;

type Params = Record<string, string | boolean | Date | null>;

// Prisma-style `sqlserver://host:port;database=..;user=..;password=..` to the driver's options.
function connectionConfig(url: string): sql.config {
  const [location, ...pairs] = url.replace(/^sqlserver:\/\//i, "").split(";");
  const options = new Map(pairs.map((pair) => [pair.slice(0, pair.indexOf("=")).toLowerCase(), pair.slice(pair.indexOf("=") + 1)]));
  const [server, port] = location.split(":");
  return {
    server,
    port: port ? Number(port) : undefined,
    database: options.get("database"),
    user: options.get("user"),
    password: options.get("password"),
    options: {
      instanceName: options.get("instancename"),
      encrypt: options.get("encrypt") !== "false",
      trustServerCertificate: options.get("trustservercertificate") === "true",
    },
  };
}

// Connects with the runtime login (DML only), the same one production uses.
export function openDatabase() {
  const pool = new sql.ConnectionPool(connectionConfig(loadE2eUrls().runtime));
  const connected = pool.connect();

  async function query<Row = Record<string, unknown>>(text: string, params: Params = {}) {
    await connected;
    const request = pool.request();
    for (const [name, value] of Object.entries(params)) request.input(name, value);
    return (await request.query(text)).recordset as Row[];
  }

  async function categoryIds(...keys: CategoryKey[]) {
    const rows = await query<{ id: string; name: string }>(
      "SELECT id, name FROM [dbo].[Category] WHERE name IN (SELECT value FROM STRING_SPLIT(@names, '|'))",
      { names: keys.map((key) => CATEGORY_NAMES[key]).join("|") },
    );
    return keys.map((key) => rows.find((row) => row.name === CATEGORY_NAMES[key])!.id);
  }

  return {
    categoryIds,
    async findPrompt(where: { id?: string; titleContains?: string }) {
      const [prompt] = await query<{ id: string; title: string; content: string; description: string | null; authorOid: string }>(
        `SELECT TOP 1 id, title, content, description, authorOid FROM [dbo].[Prompt]
         WHERE (@id IS NULL OR id = @id) AND (@title IS NULL OR title LIKE '%' + @title + '%')`,
        { id: where.id ?? null, title: where.titleContains ?? null },
      );
      return prompt ?? null;
    },
    async findCategory(name: string) {
      const [category] = await query<{ id: string; name: string }>("SELECT id, name FROM [dbo].[Category] WHERE name = @name", { name });
      return category ?? null;
    },
    async deleteCategoriesTagged(tag: string) {
      await query("DELETE FROM [dbo].[Category] WHERE name LIKE '%' + @tag + '%'", { tag });
    },
    async findUser(oid: string) {
      const [user] = await query<{ oid: string; displayName: string; isAdministrator: boolean }>(
        "SELECT oid, displayName, isAdministrator FROM [dbo].[User] WHERE oid = @oid",
        { oid },
      );
      return user ?? null;
    },
    async seedBaseline() {
      const users: [Persona, boolean][] = [[AUTHOR, false], [OTHER_USER, false], [ADMINISTRATOR, true]];
      for (const [{ oid, name }, isAdministrator] of users) {
        await query(
          `IF EXISTS (SELECT 1 FROM [dbo].[User] WHERE oid = @oid)
             UPDATE [dbo].[User] SET displayName = @name, isAdministrator = @admin WHERE oid = @oid
           ELSE INSERT INTO [dbo].[User] (oid, displayName, isAdministrator) VALUES (@oid, @name, @admin)`,
          { oid, name, admin: isAdministrator },
        );
      }
      for (const name of Object.values(CATEGORY_NAMES)) {
        await query(
          "IF NOT EXISTS (SELECT 1 FROM [dbo].[Category] WHERE name = @name) INSERT INTO [dbo].[Category] (id, name, color) VALUES (@id, @name, '#2563EB')",
          { id: randomUUID(), name },
        );
      }
    },
    // Prompts are matched by a per-test tag in the title, so tests never touch each other's data.
    async createPrompt(data: {
      author: Persona; categories: CategoryKey[]; title: string; content?: string; description?: string; createdAt?: Date;
    }) {
      const id = randomUUID();
      const now = data.createdAt ?? new Date();
      await query(
        `INSERT INTO [dbo].[Prompt] (id, title, content, description, authorOid, createdAt, updatedAt)
         VALUES (@id, @title, @content, @description, @author, @now, @now)`,
        {
          id, title: data.title, content: data.content ?? "Contenido de prueba",
          description: data.description ?? null, author: data.author.oid, now,
        },
      );
      for (const categoryId of await categoryIds(...data.categories)) {
        await query("INSERT INTO [dbo].[PromptCategory] (promptId, categoryId) VALUES (@id, @categoryId)", { id, categoryId });
      }
      return { id };
    },
    async deletePromptsTagged(tag: string) {
      await query("DELETE FROM [dbo].[Prompt] WHERE title LIKE '%' + @tag + '%'", { tag });
    },
    async deleteUser(oid: string) {
      await query("DELETE FROM [dbo].[Prompt] WHERE authorOid = @oid", { oid });
      await query("DELETE FROM [dbo].[User] WHERE oid = @oid", { oid });
    },
    async close() {
      await connected.catch(() => undefined);
      await pool.close();
    },
  };
}

export type E2eDatabase = ReturnType<typeof openDatabase>;

// Short unique token for titles and search terms; letters and digits only so it is a single search word.
export const uniqueTag = (prefix = "tag") => `${prefix}${randomUUID().replace(/-/g, "").slice(0, 12)}`;
