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
      await seedPrompt(db.client, { title, authorOid: user.oid, categoryIds: [category.id] });
    }

    for (const [q, title] of [["%", "100% útil"], ["_", "campo_nombre"], ["[", "[ejemplo]"]]) {
        const result = await db.prompts.list({ categoryIds: [], q, offset: 0, limit: 12 });
      expect(result.items.map((prompt) => prompt.title)).toEqual([title]);
      expect(result.total).toBe(1);
    }
  });

  it("combines search, several Categories and pagination without duplicates", async () => {
      const user = await seedUser(db.client);
      const first = await seedCategory(db.client);
      const second = await seedCategory(db.client);
      const third = await seedCategory(db.client);
      for (let i = 0; i < 5; i++) {
        await seedPrompt(db.client, {
          title: `Informe ${i}`,
          authorOid: user.oid,
          categoryIds: [first.id, second.id],
          createdAt: new Date(Date.UTC(2026, 0, 1, 0, i)),
        });
      }
      await seedPrompt(db.client, { title: "Informe otro", authorOid: user.oid, categoryIds: [third.id] });
      await seedPrompt(db.client, { title: "Sin relación", authorOid: user.oid, categoryIds: [first.id] });

      const page = await db.prompts.list({ categoryIds: [first.id, second.id], q: "informe", offset: 2, limit: 2 });

      expect(page.total).toBe(5);
      expect(page.items.map((prompt) => prompt.title)).toEqual(["Informe 2", "Informe 1"]);
  });
});
