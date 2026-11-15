import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { ConflictError } from "@/lib/errors";
import { openDatabase, seedCategory, seedPrompt, seedUser } from "./support/db";

const db = openDatabase();
const { client } = db;
const missing = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";
const MAX_CONTENT_LENGTH = 10_000;

beforeEach(() => db.reset());
afterAll(() => db.close());

async function setup() {
  const author = await seedUser(client, { displayName: "Ada" });
  const category = await seedCategory(client, { name: "General", color: "#112233" });
  return { author, category };
}

describe("prompts", () => {
  it("creates a Prompt and returns it with its Category and Author", async () => {
    const { author, category } = await setup();

    const created = await db.prompts.create({
      title: "Title",
      content: "Body",
      categoryId: category.id,
      authorOid: author.oid,
    });

    expect(created).toMatchObject({
      title: "Title",
      content: "Body",
      description: null,
      category: { id: category.id, name: "General", color: "#112233" },
      author: { oid: author.oid, displayName: "Ada" },
    });
    expect(await db.prompts.findById(created.id)).toEqual(created);
  });

  it("round-trips unicode and the maximum content length", async () => {
    const { author, category } = await setup();
    const prefix = "Hola 👋 ñ 漢字 ";
    const content = prefix + "x".repeat(MAX_CONTENT_LENGTH - prefix.length);

    const created = await db.prompts.create({
      title: "Ünïcode ✓",
      content,
      description: "d".repeat(500),
      categoryId: category.id,
      authorOid: author.oid,
    });

    const stored = await db.prompts.findById(created.id);
    expect(content).toHaveLength(MAX_CONTENT_LENGTH);
    expect(stored?.title).toBe("Ünïcode ✓");
    expect(stored?.content).toBe(content);
    expect(stored?.description).toHaveLength(500);
  });

  it("rejects an unknown Category or Author with Conflict", async () => {
    const { author, category } = await setup();
    const data = { title: "T", content: "C" };

    await expect(db.prompts.create({ ...data, categoryId: missing, authorOid: author.oid })).rejects.toBeInstanceOf(
      ConflictError,
    );
    await expect(db.prompts.create({ ...data, categoryId: category.id, authorOid: missing })).rejects.toBeInstanceOf(
      ConflictError,
    );
    expect(await client.prompt.count()).toBe(0);
  });

  it("updates the Prompt, keeps the Author and moves updatedAt forward", async () => {
    const { author, category } = await setup();
    const other = await seedCategory(client, { name: "Other" });
    const past = new Date("2026-01-01T00:00:00Z");
    const created = await seedPrompt(client, {
      categoryId: category.id,
      authorOid: author.oid,
      createdAt: past,
      updatedAt: past,
    });

    const updated = await db.prompts.update(created.id, { title: "New", content: "New", categoryId: other.id });

    expect(updated).toMatchObject({ title: "New", category: { id: other.id }, author: { oid: author.oid } });
    expect(updated!.updatedAt.getTime()).toBeGreaterThan(past.getTime());
    expect(updated!.createdAt).toEqual(past);
  });

  it("returns null when updating a missing Prompt and rejects an unknown Category", async () => {
    const { author, category } = await setup();
    const created = await seedPrompt(client, { categoryId: category.id, authorOid: author.oid });

    expect(await db.prompts.update(missing, { title: "x", content: "x", categoryId: category.id })).toBeNull();
    await expect(
      db.prompts.update(created.id, { title: "x", content: "x", categoryId: missing }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("deletes physically and reports whether something was deleted", async () => {
    const { author, category } = await setup();
    const created = await seedPrompt(client, { categoryId: category.id, authorOid: author.oid });

    expect(await db.prompts.delete(created.id)).toBe(true);
    expect(await db.prompts.delete(created.id)).toBe(false);
    expect(await client.prompt.count()).toBe(0);
  });
});

describe("prompt listing", () => {
  it("orders by createdAt descending and breaks ties by id descending", async () => {
    const { author, category } = await setup();
    const tie = new Date("2026-01-02T00:00:00Z");
    await seedPrompt(client, { categoryId: category.id, authorOid: author.oid, title: "older", createdAt: new Date("2026-01-01T00:00:00Z") });
    await seedPrompt(client, { categoryId: category.id, authorOid: author.oid, title: "tie-a", createdAt: tie, id: "00000000-0000-4000-8000-000000000001" });
    await seedPrompt(client, { categoryId: category.id, authorOid: author.oid, title: "tie-b", createdAt: tie, id: "00000000-0000-4000-8000-000000000002" });
    await seedPrompt(client, { categoryId: category.id, authorOid: author.oid, title: "newer", createdAt: new Date("2026-01-03T00:00:00Z") });

    const { items, total } = await db.prompts.list({ offset: 0, limit: 20 });

    expect(total).toBe(4);
    expect(items.map((p) => p.title)).toEqual(["newer", "tie-b", "tie-a", "older"]);
  });

  it("paginates without gaps or repeats", async () => {
    const { author, category } = await setup();
    for (let i = 0; i < 25; i++) {
      await seedPrompt(client, { categoryId: category.id, authorOid: author.oid, title: `P${i}`, createdAt: new Date(Date.UTC(2026, 0, 1, 0, i)) });
    }

    const first = await db.prompts.list({ offset: 0, limit: 20 });
    const second = await db.prompts.list({ offset: 20, limit: 20 });

    expect(first.items).toHaveLength(20);
    expect(second.items.map((p) => p.title)).toEqual(["P4", "P3", "P2", "P1", "P0"]);
    expect(new Set([...first.items, ...second.items].map((p) => p.id)).size).toBe(25);
    expect(second.total).toBe(25);
  });

  it("filters by Category and counts only the filtered Prompts", async () => {
    const { author, category } = await setup();
    const other = await seedCategory(client, { name: "Other" });
    await seedPrompt(client, { categoryId: category.id, authorOid: author.oid, title: "in general" });
    await seedPrompt(client, { categoryId: other.id, authorOid: author.oid, title: "in other" });

    const { items, total } = await db.prompts.list({ categoryId: other.id, offset: 0, limit: 20 });

    expect(items.map((p) => p.title)).toEqual(["in other"]);
    expect(total).toBe(1);
  });
});
