import { z } from "zod";

export const MAX_PAGE = 10_000;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 50;

export const idSchema = z.uuid();

// Entra object ids are GUIDs; z.guid() does not enforce RFC version bits. Lowercased for stable comparisons.
export const oidSchema = z.guid().transform((value) => value.toLowerCase());

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).max(MAX_PAGE).default(1),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
});

export type Pagination = z.infer<typeof paginationSchema>;
