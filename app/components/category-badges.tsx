import type { CategoryDto } from "@/lib/dto/dtos";

// Categories arrive alphabetically; `limit` collapses the rest behind "+N" while keeping them readable for assistive tech.
export function CategoryBadges({ categories, limit }: { categories: CategoryDto[]; limit?: number }) {
  const shown = limit ? categories.slice(0, limit) : categories;
  const hidden = categories.slice(shown.length);
  const hiddenNames = hidden.map((category) => category.name).join(", ");
  return (
    <span className="category-badges">
      {shown.map((category) => (
        <span key={category.id} className="category-badge">
          <span className="category-dot" style={{ backgroundColor: category.color }} />{category.name}
        </span>
      ))}
      {hidden.length > 0 && (
        <span className="category-badge category-badge-more">
          <span aria-hidden="true" title={hiddenNames}>+{hidden.length}</span>
          <span className="sr-only">y {hidden.length} {hidden.length === 1 ? "Categoría más" : "Categorías más"}: {hiddenNames}</span>
        </span>
      )}
    </span>
  );
}
