import { describe, expect, it, vi } from "vitest";

const actions = vi.hoisted(() => {
  const names = [
    "createPrompt",
    "updatePrompt",
    "deletePrompt",
    "createCategory",
    "updateCategory",
    "deleteCategory",
    "promoteAdministrator",
    "demoteAdministrator",
  ] as const;
  return Object.fromEntries(names.map((name) => [name, vi.fn().mockResolvedValue({ ok: true, data: name })]));
});

vi.mock("@/lib/container", () => ({ getContainer: () => ({ actions }) }));

import * as administrators from "@/app/actions/administrators";
import * as categories from "@/app/actions/categories";
import * as prompts from "@/app/actions/prompts";

const form = new FormData();
const id = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";

describe("Server Action wrappers", () => {
  it("export only the intended actions", () => {
    expect(Object.keys(prompts).sort()).toEqual(["createPrompt", "deletePrompt", "updatePrompt"]);
    expect(Object.keys(categories).sort()).toEqual(["createCategory", "deleteCategory", "updateCategory"]);
    expect(Object.keys(administrators).sort()).toEqual(["demoteAdministrator", "promoteAdministrator"]);
  });

  it("pass the raw arguments through to the matching action", async () => {
    await prompts.createPrompt(form);
    await prompts.updatePrompt(id, form);
    await prompts.deletePrompt(id);
    await categories.createCategory(form);
    await categories.updateCategory(id, form);
    await categories.deleteCategory(id);
    await administrators.promoteAdministrator(id);
    await administrators.demoteAdministrator(id);

    expect(actions.createPrompt).toHaveBeenCalledWith(form);
    expect(actions.updatePrompt).toHaveBeenCalledWith(id, form);
    expect(actions.deletePrompt).toHaveBeenCalledWith(id);
    expect(actions.createCategory).toHaveBeenCalledWith(form);
    expect(actions.updateCategory).toHaveBeenCalledWith(id, form);
    expect(actions.deleteCategory).toHaveBeenCalledWith(id);
    expect(actions.promoteAdministrator).toHaveBeenCalledWith(id);
    expect(actions.demoteAdministrator).toHaveBeenCalledWith(id);
  });

  it("return the result of the action", async () => {
    expect(await prompts.deletePrompt(id)).toEqual({ ok: true, data: "deletePrompt" });
  });
});
