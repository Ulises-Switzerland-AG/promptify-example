import "server-only";
import { toAdministratorUserDto, toCategoryDto, toMeDto, toPromptDetailDto, toPromptListItemDto } from "@/lib/dto/dtos";
import { idSchema } from "@/lib/schemas/common";
import { promptListQuerySchema } from "@/lib/schemas/prompt";
import type { CategoryService } from "@/lib/services/category-service";
import type { AdministratorService } from "@/lib/services/administrator-service";
import type { PromptService } from "@/lib/services/prompt-service";
import { parseInput, readSearchParams } from "./parse";
import type { ActionRunner } from "./run-action";

export function createQueries(deps: {
  run: ActionRunner;
  services: { prompts: PromptService; categories: CategoryService; administrators: AdministratorService };
}) {
  const { run, services } = deps;

  return {
    listPrompts: (searchParams: unknown) =>
      run(
        () =>
          parseInput(
            promptListQuerySchema,
            readSearchParams(searchParams, ["page", "pageSize", "categoryId", "q"] as const),
          ),
        async (user, query) => {
          const result = await services.prompts.list(user, query);
          return { ...result, items: result.items.map(toPromptListItemDto) };
        },
      ),

    getPrompt: (id: unknown) =>
      run(
        () => parseInput(idSchema, id),
        async (user, promptId) => toPromptDetailDto(await services.prompts.get(user, promptId), user),
      ),

    listCategories: () =>
      run(
        () => undefined,
        async (user) => (await services.categories.list(user)).map(toCategoryDto),
      ),

    listUsers: () =>
      run(
        () => undefined,
        async (user) => (await services.administrators.listUsers(user)).map(toAdministratorUserDto),
      ),

    getMe: () =>
      run(
        () => undefined,
        async (user) => toMeDto(user),
      ),
  };
}
