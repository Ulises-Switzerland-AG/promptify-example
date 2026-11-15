import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { openDatabase, seedCategory, seedPrompt, seedUser } from "./support/db";

const db = openDatabase();
const { client } = db;

beforeEach(() => db.reset());
afterAll(() => db.close());

const codeOf = (error: unknown) => (error as { code?: string }).code;

describe("database constraints", () => {
  it("enforces a unique oid", async () => {
    const user = await seedUser(client);

    const error = await seedUser(client, { oid: user.oid }).catch((e) => e);

    expect(codeOf(error)).toBe("P2002");
  });

  it("enforces a unique Category name", async () => {
    await seedCategory(client, { name: "Same" });

    const error = await seedCategory(client, { name: "Same" }).catch((e) => e);

    expect(codeOf(error)).toBe("P2002");
  });

  it("restricts deleting a Category that has Prompts", async () => {
    const author = await seedUser(client);
    const category = await seedCategory(client);
    await seedPrompt(client, { categoryId: category.id, authorOid: author.oid });

    const error = await client.category.delete({ where: { id: category.id } }).catch((e) => e);

    expect(codeOf(error)).toBe("P2003");
  });

  it("restricts deleting a User that has Prompts", async () => {
    const author = await seedUser(client);
    const category = await seedCategory(client);
    await seedPrompt(client, { categoryId: category.id, authorOid: author.oid });

    const error = await client.user.delete({ where: { oid: author.oid } }).catch((e) => e);

    expect(codeOf(error)).toBe("P2003");
  });

  it("rejects colors and lengths the schema cannot hold", async () => {
    await expect(seedCategory(client, { color: "#1122334" })).rejects.toThrow(/too long|truncat/i);
    await expect(seedCategory(client, { name: "n".repeat(51) })).rejects.toThrow(/too long|truncat/i);
  });
});

describe("runtime login permissions (SECURITY.md §6)", () => {
  it("can read and write application tables", async () => {
    await seedUser(client);

    expect(await client.user.count()).toBe(1);
  });

  it("cannot create, alter or drop tables", async () => {
    const denied = /permission denied|permission was denied|do not have permission/i;
    await expect(client.$executeRaw`CREATE TABLE dbo.runtime_should_not_create (id int)`).rejects.toThrow(denied);
    await expect(client.$executeRaw`ALTER TABLE dbo.[User] ADD extra int`).rejects.toThrow(denied);
    await expect(client.$executeRaw`DROP TABLE dbo.[Prompt]`).rejects.toThrow(denied);
  });

  it("is not a member of db_owner", async () => {
    const rows = await client.$queryRaw<{ isOwner: number }[]>`SELECT IS_MEMBER('db_owner') AS isOwner`;

    expect(rows[0].isOwner).toBe(0);
  });
});
