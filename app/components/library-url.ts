import { MAX_FILTER_CATEGORIES } from "@/lib/schemas/category-limits";

export function libraryUrl({ q, categoryIds, page }: { q: string; categoryIds: string[]; page: number }) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  for (const id of categoryIds) params.append("categoryId", id);
  if (page > 1) params.set("page", String(page));
  return params.size ? `/?${params}` : "/";
}

export function toggleCategory(selected: string[], id: string) {
  if (selected.includes(id)) return selected.filter((selectedId) => selectedId !== id);
  return selected.length >= MAX_FILTER_CATEGORIES ? selected : [...selected, id];
}

export function categoryHeading(categoryIds: string[], categories: { id: string; name: string }[]) {
  if (categoryIds.length === 0) return "Todos los Prompts";
  if (categoryIds.length === 1) return categories.find((category) => category.id === categoryIds[0])?.name ?? "Categoría";
  return `${categoryIds.length} Categorías`;
}
