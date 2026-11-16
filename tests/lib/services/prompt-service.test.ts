import { beforeEach, describe, expect, it, vi } from "vitest";
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors";
import { PromptService } from "@/lib/services/prompt-service";
import type { CurrentUser } from "@/lib/services/types";
import { createFakeRepositories } from "../../fakes/repositories";

const missingId = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";
const author: CurrentUser = { oid: "a0000000-0000-4000-8000-000000000001", name: "Author", isAdministrator: false };
const other: CurrentUser = { oid: "b0000000-0000-4000-8000-000000000002", name: "Other", isAdministrator: false };
const admin: CurrentUser = { oid: "c0000000-0000-4000-8000-000000000003", name: "Admin", isAdministrator: true };

describe("PromptService", () => {
  let repos: ReturnType<typeof createFakeRepositories>;
  let service: PromptService;
  let categoryId: string;

  beforeEach(() => {
    repos = createFakeRepositories();
    [author, other, admin].forEach((u) => repos.db.seedUser(u));
    categoryId = repos.db.seedCategory({ name: "General" }).id;
    service = new PromptService({ prompts: repos.prompts, categories: repos.categories });
  });

  describe("list", () => {
    it("translates page and pageSize into an offset and a limit", async () => {
      const list = vi.spyOn(repos.prompts, "list");

      await service.list(other, { page: 1, pageSize: 20, categoryIds: [] });
      await service.list(other, { page: 3, pageSize: 10, categoryIds: [] });

      expect(list.mock.calls.map(([criteria]) => criteria)).toEqual([
        { categoryIds: [], offset: 0, limit: 20 },
        { categoryIds: [], offset: 20, limit: 10 },
      ]);
    });

    it("returns the page, page size and total reported by the repository", async () => {
      for (let i = 0; i < 3; i++) repos.db.seedPrompt({ categoryIds: [categoryId], authorOid: author.oid });

      const result = await service.list(other, { page: 1, pageSize: 2, categoryIds: [] });

      expect(result).toMatchObject({ page: 1, pageSize: 2, total: 3 });
      expect(result.items).toHaveLength(2);
    });

    it("ignores filter Categories that do not exist", async () => {
      const list = vi.spyOn(repos.prompts, "list");

      await service.list(other, { page: 1, pageSize: 20, categoryIds: [missingId] });

      expect(list).toHaveBeenCalledWith({ categoryIds: [], offset: 0, limit: 20 });
    });

    it("passes only the existing filter Categories to the repository", async () => {
      const otherCategory = repos.db.seedCategory({ name: "Other" });
      const list = vi.spyOn(repos.prompts, "list");

      await service.list(other, { page: 1, pageSize: 20, categoryIds: [otherCategory.id, missingId] });

      expect(list).toHaveBeenCalledWith({ categoryIds: [otherCategory.id], offset: 0, limit: 20 });
    });

    it("lists Prompts having any of several Categories", async () => {
      const second = repos.db.seedCategory({ name: "Second" });
      const third = repos.db.seedCategory({ name: "Third" });
      repos.db.seedPrompt({ categoryIds: [categoryId], authorOid: author.oid, title: "A" });
      repos.db.seedPrompt({ categoryIds: [second.id, third.id], authorOid: author.oid, title: "B" });
      repos.db.seedPrompt({ categoryIds: [third.id], authorOid: author.oid, title: "C" });

      const result = await service.list(other, { page: 1, pageSize: 20, categoryIds: [categoryId, second.id] });

      expect(result.items.map((prompt) => prompt.title).sort()).toEqual(["A", "B"]);
    });
  });

  describe("get", () => {
    it("lets any User view any Prompt", async () => {
      const stored = repos.db.seedPrompt({ categoryIds: [categoryId], authorOid: author.oid, title: "Visible" });

      const prompt = await service.get(other, stored.id);

      expect(prompt.title).toBe("Visible");
      expect(prompt.author.oid).toBe(author.oid);
    });

    it("throws NotFound for a missing Prompt", async () => {
      await expect(service.get(other, missingId)).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe("create", () => {
    it("makes the current User the Author", async () => {
      const prompt = await service.create(author, { title: "T", content: "C", categoryIds: [categoryId] });

      expect(prompt.author.oid).toBe(author.oid);
      expect(repos.db.prompts.get(prompt.id)?.authorOid).toBe(author.oid);
    });

    it("stores every Category", async () => {
      const second = repos.db.seedCategory({ name: "Alpha" });

      const prompt = await service.create(author, { title: "T", content: "C", categoryIds: [categoryId, second.id] });

      expect(prompt.categories.map((category) => category.name)).toEqual(["Alpha", "General"]);
    });

    it("ignores any authorOid smuggled into the input", async () => {
      const input = { title: "T", content: "C", categoryIds: [categoryId], authorOid: other.oid } as never;

      const prompt = await service.create(author, input);

      expect(prompt.author.oid).toBe(author.oid);
    });

    it("rejects a Category that does not exist", async () => {
      await expect(
        service.create(author, { title: "T", content: "C", categoryIds: [categoryId, missingId] }),
      ).rejects.toBeInstanceOf(ValidationError);
    });

    it.each([
      ["none", () => []],
      ["more than five", () => Array.from({ length: 6 }, () => repos.db.seedCategory().id)],
      ["repeated", () => [categoryId, categoryId]],
    ])("rejects %s Categories before writing", async (_label, ids) => {
      const create = vi.spyOn(repos.prompts, "create");

      await expect(service.create(author, { title: "T", content: "C", categoryIds: ids() })).rejects.toBeInstanceOf(
        ValidationError,
      );
      expect(create).not.toHaveBeenCalled();
    });
  });

  describe("update", () => {
    const body = (categoryIds: string[]) => ({ title: "x", content: "x", categoryIds });

    it("lets the Author edit and keeps the Author", async () => {
      const stored = repos.db.seedPrompt({ categoryIds: [categoryId], authorOid: author.oid });

      const updated = await service.update(author, stored.id, { title: "New", content: "Body", categoryIds: [categoryId] });

      expect(updated).toMatchObject({ title: "New", content: "Body" });
      expect(updated.author.oid).toBe(author.oid);
    });

    it("replaces the Categories", async () => {
      const second = repos.db.seedCategory({ name: "Second" });
      const stored = repos.db.seedPrompt({ categoryIds: [categoryId], authorOid: author.oid });

      const updated = await service.update(author, stored.id, body([second.id]));

      expect(updated.categories.map((category) => category.id)).toEqual([second.id]);
    });

    it("forbids another User", async () => {
      const stored = repos.db.seedPrompt({ categoryIds: [categoryId], authorOid: author.oid, title: "Mine" });

      await expect(service.update(other, stored.id, body([categoryId]))).rejects.toBeInstanceOf(ForbiddenError);
      expect(repos.db.prompts.get(stored.id)?.title).toBe("Mine");
    });

    it("forbids an Administrator who is not the Author", async () => {
      const stored = repos.db.seedPrompt({ categoryIds: [categoryId], authorOid: author.oid });

      await expect(service.update(admin, stored.id, body([categoryId]))).rejects.toBeInstanceOf(ForbiddenError);
    });

    it("throws NotFound for a missing Prompt", async () => {
      await expect(service.update(author, missingId, body([categoryId]))).rejects.toBeInstanceOf(NotFoundError);
    });

    it("rejects a Category that does not exist", async () => {
      const stored = repos.db.seedPrompt({ categoryIds: [categoryId], authorOid: author.oid });

      await expect(service.update(author, stored.id, body([missingId]))).rejects.toBeInstanceOf(ValidationError);
    });

    it.each([
      ["none", () => []],
      ["more than five", () => Array.from({ length: 6 }, () => repos.db.seedCategory().id)],
      ["repeated", () => [categoryId, categoryId]],
    ])("rejects %s Categories before writing", async (_label, ids) => {
      const stored = repos.db.seedPrompt({ categoryIds: [categoryId], authorOid: author.oid });
      const update = vi.spyOn(repos.prompts, "update");

      await expect(service.update(author, stored.id, body(ids()))).rejects.toBeInstanceOf(ValidationError);
      expect(update).not.toHaveBeenCalled();
    });
  });

  describe("delete", () => {
    it("lets the Author delete", async () => {
      const stored = repos.db.seedPrompt({ categoryIds: [categoryId], authorOid: author.oid });

      await service.delete(author, stored.id);

      expect(repos.db.prompts.has(stored.id)).toBe(false);
    });

    it("lets an Administrator delete someone else's Prompt", async () => {
      const stored = repos.db.seedPrompt({ categoryIds: [categoryId], authorOid: author.oid });

      await service.delete(admin, stored.id);

      expect(repos.db.prompts.has(stored.id)).toBe(false);
    });

    it("forbids another User", async () => {
      const stored = repos.db.seedPrompt({ categoryIds: [categoryId], authorOid: author.oid });

      await expect(service.delete(other, stored.id)).rejects.toBeInstanceOf(ForbiddenError);
      expect(repos.db.prompts.has(stored.id)).toBe(true);
    });

    it("throws NotFound for a missing Prompt", async () => {
      await expect(service.delete(author, missingId)).rejects.toBeInstanceOf(NotFoundError);
    });
  });
});
