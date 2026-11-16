import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { CategoryPicker } from "@/app/components/category-picker";
import { categorySelectionError } from "@/app/components/category-selection";

describe("categorySelectionError", () => {
  it("asks for at least one Category before submitting", () => {
    const empty = new FormData();
    empty.append("title", "T");
    const chosen = new FormData();
    chosen.append("categoryId", "a");

    expect(categorySelectionError(empty)).toBe("Elige al menos una Categoría.");
    expect(categorySelectionError(chosen)).toBeNull();
  });
});

describe("CategoryPicker", () => {
  const categories = Array.from({ length: 6 }, (_, i) => ({ id: `c${i}`, name: `Cat ${i}`, color: "#112233" }));
  const render = (selected: string[]) =>
    renderToStaticMarkup(createElement(CategoryPicker, { categories, selected, onChange: () => {} }));

  it("shows the count and leaves every option enabled below the limit", () => {
    const html = render(["c0", "c1", "c2", "c3"]);

    expect(html).toContain("4 de 5");
    expect(html).not.toContain("máximo alcanzado");
    expect(html).not.toContain('disabled=""');
  });

  it("disables only the unchecked options once five are selected", () => {
    const html = render(["c0", "c1", "c2", "c3", "c4"]);

    expect(html).toContain("5 de 5 · máximo alcanzado");
    expect(html.match(/checked=""/g)).toHaveLength(5);
    const disabled = html.match(/<input[^>]*disabled=""[^>]*>/g)!;
    expect(disabled).toHaveLength(1);
    expect(disabled[0]).toContain('value="c5"');
  });
});
