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
  it("creates a Prompt and returns it with its Categories and Author", async () => {
    const { author, category } = await setup();
    const alpha = await seedCategory(client, { name: "Alpha", color: "#445566" });

    const created = await db.prompts.create({
      title: "Title",
      content: "Body",
      categoryIds: [category.id, alpha.id],
      authorOid: author.oid,
    });

    expect(created).toMatchObject({
      title: "Title",
      content: "Body",
      description: null,
      categories: [
        { id: alpha.id, name: "Alpha", color: "#445566" },
        { id: category.id, name: "General", color: "#112233" },
      ],
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
      categoryIds: [category.id],
      authorOid: author.oid,
    });

    const stored = await db.prompts.findById(created.id);
    expect(content).toHaveLength(MAX_CONTENT_LENGTH);
    expect(stored?.title).toBe("Ünïcode ✓");
    expect(stored?.content).toBe(content);
    expect(stored?.description).toHaveLength(500);
  });

  it("rejects an unknown Category or Author with Conflict and stores nothing", async () => {
    const { author, category } = await setup();
    const data = { title: "T", content: "C" };

    await expect(
      db.prompts.create({ ...data, categoryIds: [category.id, missing], authorOid: author.oid }),
    ).rejects.toBeInstanceOf(ConflictError);
    await expect(db.prompts.create({ ...data, categoryIds: [category.id], authorOid: missing })).rejects.toBeInstanceOf(
      ConflictError,
    );
    expect(await client.prompt.count()).toBe(0);
    expect(await client.promptCategory.count()).toBe(0);
  });

  it("updates the Prompt, keeps the Author and moves updatedAt forward", async () => {
    const { author, category } = await setup();
    const other = await seedCategory(client, { name: "Other" });
    const past = new Date("2026-01-01T00:00:00Z");
    const created = await seedPrompt(client, {
      categoryIds: [category.id],
      authorOid: author.oid,
      createdAt: past,
      updatedAt: past,
    });

    const updated = await db.prompts.update(created.id, { title: "New", content: "New", categoryIds: [other.id] });

    expect(updated).toMatchObject({ title: "New", categories: [{ id: other.id }], author: { oid: author.oid } });
    expect(updated!.updatedAt.getTime()).toBeGreaterThan(past.getTime());
    expect(updated!.createdAt).toEqual(past);
  });

  it("replaces the Category set, including overlapping sets", async () => {
    const { author, category } = await setup();
    const second = await seedCategory(client, { name: "Second" });
    const third = await seedCategory(client, { name: "Third" });
    const created = await seedPrompt(client, { categoryIds: [category.id, second.id], authorOid: author.oid });

    const updated = await db.prompts.update(created.id, {
      title: "T",
      content: "C",
      categoryIds: [second.id, third.id],
    });

    expect(updated!.categories.map((c) => c.name)).toEqual(["Second", "Third"]);
    expect(await client.promptCategory.count({ where: { promptId: created.id } })).toBe(2);
  });

  it("returns null when updating a missing Prompt and leaves the Categories untouched on an unknown Category", async () => {
    const { author, category } = await setup();
    const created = await seedPrompt(client, { categoryIds: [category.id], authorOid: author.oid });

    expect(await db.prompts.update(missing, { title: "x", content: "x", categoryIds: [category.id] })).toBeNull();
    await expect(
      db.prompts.update(created.id, { title: "changed", content: "x", categoryIds: [missing] }),
    ).rejects.toBeInstanceOf(ConflictError);

    const stored = await db.prompts.findById(created.id);
    expect(stored?.title).toBe("Title");
    expect(stored?.categories.map((c) => c.id)).toEqual([category.id]);
  });

  it("deletes physically with its Category links and reports whether something was deleted", async () => {
    const { author, category } = await setup();
    const created = await seedPrompt(client, { categoryIds: [category.id], authorOid: author.oid });

    expect(await db.prompts.delete(created.id)).toBe(true);
    expect(await db.prompts.delete(created.id)).toBe(false);
    expect(await client.prompt.count()).toBe(0);
    expect(await client.promptCategory.count()).toBe(0);
  });
});

describe("prompt listing", () => {
  it("orders by createdAt descending and breaks ties by id descending", async () => {
    const { author, category } = await setup();
    const tie = new Date("2026-01-02T00:00:00Z");
    const categoryIds = [category.id];
    await seedPrompt(client, { categoryIds, authorOid: author.oid, title: "older", createdAt: new Date("2026-01-01T00:00:00Z") });
    await seedPrompt(client, { categoryIds, authorOid: author.oid, title: "tie-a", createdAt: tie, id: "00000000-0000-4000-8000-000000000001" });
    await seedPrompt(client, { categoryIds, authorOid: author.oid, title: "tie-b", createdAt: tie, id: "00000000-0000-4000-8000-000000000002" });
    await seedPrompt(client, { categoryIds, authorOid: author.oid, title: "newer", createdAt: new Date("2026-01-03T00:00:00Z") });

    const { items, total } = await db.prompts.list({ categoryIds: [], offset: 0, limit: 20 });

    expect(total).toBe(4);
    expect(items.map((p) => p.title)).toEqual(["newer", "tie-b", "tie-a", "older"]);
  });

  it("paginates without gaps or repeats", async () => {
    const { author, category } = await setup();
    for (let i = 0; i < 25; i++) {
      await seedPrompt(client, { categoryIds: [category.id], authorOid: author.oid, title: `P${i}`, createdAt: new Date(Date.UTC(2026, 0, 1, 0, i)) });
    }

    const first = await db.prompts.list({ categoryIds: [], offset: 0, limit: 20 });
    const second = await db.prompts.list({ categoryIds: [], offset: 20, limit: 20 });

    expect(first.items).toHaveLength(20);
    expect(second.items.map((p) => p.title)).toEqual(["P4", "P3", "P2", "P1", "P0"]);
    expect(new Set([...first.items, ...second.items].map((p) => p.id)).size).toBe(25);
    expect(second.total).toBe(25);
  });

  it("filters by Category and counts only the filtered Prompts", async () => {
    const { author, category } = await setup();
    const other = await seedCategory(client, { name: "Other" });
    await seedPrompt(client, { categoryIds: [category.id], authorOid: author.oid, title: "in general" });
    await seedPrompt(client, { categoryIds: [other.id], authorOid: author.oid, title: "in other" });

    const { items, total } = await db.prompts.list({ categoryIds: [other.id], offset: 0, limit: 20 });

    expect(items.map((p) => p.title)).toEqual(["in other"]);
    expect(total).toBe(1);
  });

  it("lists a Prompt once when it matches several selected Categories", async () => {
    const { author, category } = await setup();
    const second = await seedCategory(client, { name: "Second" });
    const third = await seedCategory(client, { name: "Third" });
    await seedPrompt(client, { categoryIds: [category.id, second.id], authorOid: author.oid, title: "both" });
    await seedPrompt(client, { categoryIds: [second.id], authorOid: author.oid, title: "only second" });
    await seedPrompt(client, { categoryIds: [third.id], authorOid: author.oid, title: "excluded" });

    const { items, total } = await db.prompts.list({ categoryIds: [category.id, second.id], offset: 0, limit: 20 });

    expect(items.map((p) => p.title).sort()).toEqual(["both", "only second"]);
    expect(total).toBe(2);
    expect(items.find((p) => p.title === "both")?.categories).toHaveLength(2);
  });
});
