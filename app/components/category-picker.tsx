"use client";

import type { CategoryDto } from "@/lib/dto/dtos";
import { MAX_CATEGORIES_PER_PROMPT } from "@/lib/schemas/category-limits";

export function CategoryPicker({ categories, selected, onChange }: {
  categories: CategoryDto[]; selected: string[]; onChange: (ids: string[]) => void;
}) {
  const full = selected.length >= MAX_CATEGORIES_PER_PROMPT;
  const toggle = (id: string) => onChange(selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id]);
  return (
    <fieldset className="form-field category-picker" aria-describedby="category-count">
      <legend>Categorías <span>Obligatorio · de 1 a {MAX_CATEGORIES_PER_PROMPT}</span></legend>
      <div className="category-options">
        {categories.map((category) => {
          const checked = selected.includes(category.id);
          return (
            <label key={category.id} className="category-option">
              <input type="checkbox" name="categoryId" value={category.id} checked={checked}
                disabled={!checked && full} onChange={() => toggle(category.id)} />
              <span className="category-dot" style={{ backgroundColor: category.color }} />{category.name}
            </label>
          );
        })}
      </div>
      <p id="category-count" className="category-count" aria-live="polite">
        {selected.length} de {MAX_CATEGORIES_PER_PROMPT}{full && " · máximo alcanzado"}
      </p>
    </fieldset>
  );
}
