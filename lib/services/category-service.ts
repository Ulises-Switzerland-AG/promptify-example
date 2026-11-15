import "server-only";
import { ConflictError, ForbiddenError, NotFoundError } from "@/lib/errors";
import type { CategoryRepository } from "@/lib/repositories/types";
import type { CategoryInput } from "@/lib/schemas/category";
import type { CurrentUser } from "./types";

export class CategoryService {
  constructor(private readonly deps: { categories: CategoryRepository }) {}

  // Any authenticated User may list; `user` keeps the signature uniform across the service.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  list(_user: CurrentUser) {
    return this.deps.categories.list();
  }

  async create(user: CurrentUser, input: CategoryInput) {
    requireAdministrator(user);
    return this.deps.categories.create(input);
  }

  async update(user: CurrentUser, id: string, input: CategoryInput) {
    requireAdministrator(user);
    const updated = await this.deps.categories.update(id, input);
    if (!updated) throw new NotFoundError("Category not found");
    return updated;
  }

  async delete(user: CurrentUser, id: string) {
    requireAdministrator(user);
    const result = await this.deps.categories.delete(id);
    if (result === "not_found") throw new NotFoundError("Category not found");
    if (result === "has_prompts") throw new ConflictError("Category has Prompts");
  }
}

function requireAdministrator(user: CurrentUser) {
  if (!user.isAdministrator) throw new ForbiddenError();
}
