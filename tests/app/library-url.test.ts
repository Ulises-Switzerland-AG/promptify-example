import { describe, expect, it } from "vitest";
import { categoryHeading, libraryUrl, toggleCategory } from "@/app/components/library-url";

describe("libraryUrl", () => {
  it("returns the root when nothing is selected", () => {
    expect(libraryUrl({ q: "", categoryIds: [], page: 1 })).toBe("/");
  });

  it("repeats categoryId for every selected Category and keeps search and page", () => {
    expect(libraryUrl({ q: "informe", categoryIds: ["a", "b"], page: 3 })).toBe(
      "/?q=informe&categoryId=a&categoryId=b&page=3",
    );
  });

  it("omits page 1 and an empty search", () => {
    expect(libraryUrl({ q: "", categoryIds: ["a"], page: 1 })).toBe("/?categoryId=a");
  });
});

describe("toggleCategory", () => {
  it("adds a missing Category and removes a selected one", () => {
    expect(toggleCategory(["a"], "b")).toEqual(["a", "b"]);
    expect(toggleCategory(["a", "b"], "a")).toEqual(["b"]);
  });

  it("does not select more Categories than the filter allows", () => {
    const full = Array.from({ length: 20 }, (_, i) => `c${i}`);

    expect(toggleCategory(full, "extra")).toEqual(full);
    expect(toggleCategory(full, "c0")).toHaveLength(19);
  });
});

describe("categoryHeading", () => {
  const categories = [{ id: "a", name: "Análisis" }, { id: "b", name: "Legal" }];

  it("names the library, a single Category or the number of Categories", () => {
    expect(categoryHeading([], categories)).toBe("Todos los Prompts");
    expect(categoryHeading(["b"], categories)).toBe("Legal");
    expect(categoryHeading(["a", "b"], categories)).toBe("2 Categorías");
  });
});
