import { z } from "zod";
import { MAX_CATEGORIES_PER_PROMPT, MAX_FILTER_CATEGORIES, MIN_CATEGORIES_PER_PROMPT } from "./category-limits";
import { idSchema, paginationSchema } from "./common";

// Lowercased because SQL Server compares ids case-insensitively while JavaScript does not.
const categoryIdSchema = idSchema.transform((value) => value.toLowerCase());

export const promptInputSchema = z.object({
  title: z.string().trim().min(1).max(120),
  content: z.string().min(1).max(10_000).refine((value) => value.trim().length > 0),
  description: z.string().trim().max(500).optional(),
  categoryIds: z
    .array(categoryIdSchema)
    .min(MIN_CATEGORIES_PER_PROMPT)
    .max(MAX_CATEGORIES_PER_PROMPT)
    .refine((ids) => new Set(ids).size === ids.length),
});

// Filter ids come from a URL: invalid and repeated values are dropped instead of rejected.
export function parseCategoryIdsParam(raw: string | string[] | undefined): string[] {
  const ids = (Array.isArray(raw) ? raw : [raw]).flatMap((value) => {
    const parsed = categoryIdSchema.safeParse(value);
    return parsed.success ? [parsed.data] : [];
  });
  return [...new Set(ids)];
}

export const promptListQuerySchema = paginationSchema
  .extend({
    categoryId: z.union([z.string(), z.array(z.string())]).optional(),
    q: z.string().trim().max(200).transform((value) => value || undefined).optional(),
  })
  .transform(({ categoryId, ...rest }, context) => {
    const categoryIds = parseCategoryIdsParam(categoryId);
    if (categoryIds.length > MAX_FILTER_CATEGORIES) {
      context.issues.push({ code: "custom", message: "Too many Categories", input: categoryId });
      return z.NEVER;
    }
    return { ...rest, categoryIds };
  });

export type PromptInput = z.infer<typeof promptInputSchema>;
export type PromptListQuery = z.infer<typeof promptListQuerySchema>;
