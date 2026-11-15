import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { openDatabase, seedCategory, seedPrompt, seedUser } from "./support/db";

const db = openDatabase();
beforeEach(() => db.reset());
afterAll(() => db.close());

describe("literal Prompt search on SQL Server", () => {
  it("treats SQL LIKE metacharacters as literal text", async () => {
    const user = await seedUser(db.client);
    const category = await seedCategory(db.client);
    for (const title of ["100% útil", "campo_nombre", "[ejemplo]", "sin coincidencia"]) {
      await seedPrompt(db.client, { title, authorOid: user.oid, categoryId: category.id });
    }

    for (const [q, title] of [["%", "100% útil"], ["_", "campo_nombre"], ["[", "[ejemplo]"]]) {
      const result = await db.prompts.list({ q, offset: 0, limit: 12 });
      expect(result.items.map((prompt) => prompt.title)).toEqual([title]);
      expect(result.total).toBe(1);
    }
  });
});
