import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Home from "@/app/page";
import { connection } from "next/server";

const queries = vi.hoisted(() => ({
  listPrompts: vi.fn(),
  listCategories: vi.fn(),
  getMe: vi.fn(),
}));
const container = vi.hoisted(() => vi.fn());
vi.mock("@/lib/container", () => ({ getContainer: container }));
vi.mock("next/server", () => ({ connection: vi.fn().mockResolvedValue(undefined) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

const categoryId = "a0000000-0000-4000-8000-000000000001";
const secondId = "a0000000-0000-4000-8000-000000000002";
const prompt = {
  id: "b0000000-0000-4000-8000-000000000002",
  title: "Analiza un informe <script>alert(1)</script>",
  description: "Convierte los datos en decisiones.",
  categories: [{ id: categoryId, name: "Análisis", color: "#123456" }],
  authorName: "Ada",
  createdAt: "2026-11-10T12:00:00.000Z",
};

async function render(params: Record<string, string | string[]> = {}) {
  return renderToStaticMarkup(await Home({ searchParams: Promise.resolve(params) }));
}

describe("Promptify home", () => {
  beforeEach(() => {
    container.mockImplementation(() => ({ queries }));
    queries.listPrompts.mockResolvedValue({ ok: true, data: { items: [prompt], total: 25, page: 2, pageSize: 12 } });
    queries.listCategories.mockResolvedValue({ ok: true, data: [
      { id: categoryId, name: "Análisis", color: "#123456" },
      { id: secondId, name: "Legal", color: "#654321" },
    ] });
    queries.getMe.mockResolvedValue({ ok: true, data: { name: "Ada", isAdministrator: false } });
  });

  it("waits for a real request before initializing the database container", async () => {
    let requestReady = false;
    vi.mocked(connection).mockImplementationOnce(async () => { requestReady = true; });
    container.mockImplementationOnce(() => {
      expect(requestReady).toBe(true);
      return { queries };
    });
    await render();
  });

  it("renders real contributions as escaped text and links to their detail", async () => {
    const html = await render();
    expect(html).toContain("Promptify");
    expect(html).toContain("Biblioteca");
    expect(html).toContain("Convierte los datos");
    expect(html).toContain("Ada");
    expect(html).toContain(`/prompts/${prompt.id}`);
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>alert");
    expect(html).not.toContain("Next.js logo");
    expect(html).toContain("/prompts/new");
  });

  it("passes search and Category to the backend and preserves them in pagination", async () => {
    const html = await render({ q: "informe", categoryId, page: "2" });
    expect(queries.listPrompts).toHaveBeenCalledWith({ q: "informe", categoryId, page: "2", pageSize: "12" });
    expect(html).toContain(`q=informe&amp;categoryId=${categoryId}&amp;page=3`);
    expect(html).toContain('aria-current="page"');
  });

  it("carries the filtered and paginated library URL into Prompt detail", async () => {
    const html = await render({ q: "informe", categoryId, page: "2" });
    const origin = `/?q=informe&categoryId=${categoryId}&page=2`;
    expect(html).toContain(`/prompts/${prompt.id}?from=${encodeURIComponent(origin)}`);
  });

  it("preserves the current library location when opening creation", async () => {
    const html = await render({ q: "informe", categoryId, page: "2" });
    const origin = `/?q=informe&categoryId=${categoryId}&page=2`;
    expect(html).toContain(`/prompts/new?from=${encodeURIComponent(origin)}`);
  });

  it("offers every Category as a checkbox and checks the selected ones", async () => {
    const html = await render({ categoryId: [categoryId, secondId] });
    const sidebar = html.slice(html.indexOf('aria-label="Filtrar por Categoría"'), html.indexOf("</aside>"));

    expect(sidebar.match(/type="checkbox"/g)).toHaveLength(2);
    expect(sidebar.match(/checked=""/g)).toHaveLength(2);
  });

  it("leaves Categories unchecked when no filter is applied", async () => {
    const html = await render();
    const sidebar = html.slice(html.indexOf('aria-label="Filtrar por Categoría"'), html.indexOf("</aside>"));

    expect(sidebar).not.toContain('checked=""');
    expect(html).toContain("Todos los Prompts");
  });

  it("keeps every selected Category in pagination and Prompt links", async () => {
    const html = await render({ q: "informe", categoryId: [categoryId, secondId], page: "2" });

    expect(html).toContain(`q=informe&amp;categoryId=${categoryId}&amp;categoryId=${secondId}&amp;page=3`);
  });

  it("titles the list with the number of selected Categories", async () => {
    const html = await render({ categoryId: [categoryId, secondId] });

    expect(html).toContain('<h2 id="prompt-list-title">2 Categorías</h2>');
  });

  it("names the Category when only one is selected", async () => {
    const html = await render({ categoryId: secondId });

    expect(html).toContain("<h2 id=\"prompt-list-title\">Legal</h2>");
  });

  it("shows one removable chip per selected Category", async () => {
    const html = await render({ categoryId: [categoryId, secondId] });

    expect(html).toContain('aria-label="Quitar filtro Análisis"');
    expect(html).toContain('aria-label="Quitar filtro Legal"');
  });

  it("ignores filter ids that are not real Categories in the interface", async () => {
    const html = await render({ categoryId: ["a0000000-0000-4000-8000-0000000000ff", "no-es-un-id"] });
    const sidebar = html.slice(html.indexOf('aria-label="Filtrar por Categoría"'), html.indexOf("</aside>"));

    expect(sidebar).not.toContain('checked=""');
    expect(html).not.toContain("Quitar filtro");
  });

  it("replaces the single-choice select with a multi-select panel showing how many are selected", async () => {
    const html = await render({ categoryId: [categoryId, secondId] });

    expect(html).not.toContain("<select");
    expect(html).toContain("Categorías (2)");
  });

  it("shows every Category of a Prompt, and collapses the rest behind +N", async () => {
    const many = ["Uno", "Dos", "Tres", "Cuatro", "Cinco"].map((name, index) => ({
      id: `a0000000-0000-4000-8000-00000000010${index}`, name, color: "#112233",
    }));
    queries.listPrompts.mockResolvedValue({
      ok: true, data: { items: [{ ...prompt, categories: many }], total: 1, page: 1, pageSize: 12 },
    });

    const html = await render();
    const row = html.slice(html.indexOf('class="prompt-row"'));

    for (const name of ["Uno", "Dos", "Tres"]) expect(row).toContain(`</span>${name}</span>`);
    expect(row).not.toContain("</span>Cuatro</span>");
    expect(row).toContain("+2");
    expect(row).toMatch(/class="sr-only">y 2 Categorías más: Cuatro, Cinco</);
  });

  it("does not collapse up to three Categories and names a single hidden one in the singular", async () => {
    const four = ["Uno", "Dos", "Tres", "Cuatro"].map((name, index) => ({
      id: `a0000000-0000-4000-8000-00000000020${index}`, name, color: "#112233",
    }));
    queries.listPrompts.mockResolvedValue({
      ok: true, data: { items: [{ ...prompt, categories: four.slice(0, 3) }, { ...prompt, id: "other", categories: four }], total: 2, page: 1, pageSize: 12 },
    });

    const html = await render();

    expect(html.match(/category-badge-more/g)).toHaveLength(1);
    expect(html).toMatch(/class="sr-only">y 1 Categoría más: Cuatro</);
  });

  it("passes repeated categoryId params to the backend as a list", async () => {
    await render({ categoryId: [categoryId, secondId] });

    expect(queries.listPrompts).toHaveBeenCalledWith({ categoryId: [categoryId, secondId], pageSize: "12" });
  });

  it("checks exactly the selected Category in the sidebar and the mobile panel", async () => {
    const html = await render({ categoryId: secondId.toUpperCase() });

    expect(html.match(/checked=""/g)).toHaveLength(2);
    expect(html.match(/checked=""\/><span class="category-dot"[^>]*><\/span>Legal/g)).toHaveLength(2);
    expect(html).toContain("Categorías (1)");
  });

  it("renders no chip list when only a search is applied", async () => {
    const html = await render({ q: "informe" });

    expect(html).not.toContain("filter-chips");
  });

  it("disables unchecked filter options once twenty Categories are selected", async () => {
    const many = Array.from({ length: 21 }, (_, i) => ({
      id: `a0000000-0000-4000-8000-0000000003${String(i).padStart(2, "0")}`, name: `Cat ${i}`, color: "#112233",
    }));
    queries.listCategories.mockResolvedValue({ ok: true, data: many });

    const html = await render({ categoryId: many.slice(0, 20).map((category) => category.id) });

    expect(html.match(/disabled=""/g)).toHaveLength(2);
  });

  it("shows invalid input instead of silently trimming more than twenty filter ids", async () => {
    queries.listPrompts.mockResolvedValue({ ok: false, error: "Invalid input" });

    const html = await render({ categoryId: Array.from({ length: 21 }, (_, i) => `a0000000-0000-4000-8000-0000000004${String(i).padStart(2, "0")}`) });

    expect(html).toContain('role="alert"');
  });

  it("distinguishes no matches from an empty library", async () => {
    queries.listPrompts.mockResolvedValue({ ok: true, data: { items: [], total: 0, page: 1, pageSize: 12 } });
    expect(await render({ q: "inexistente" })).toContain("No encontramos");
    expect(await render()).toContain("El primer Prompt");
  });

  it("shows failed reads explicitly rather than an empty success state", async () => {
    queries.listPrompts.mockResolvedValue({ ok: false, error: "Something went wrong" });
    const html = await render();
    expect(html).toContain('role="alert"');
    expect(html).toContain("No pudimos");
    expect(html).not.toContain("El primer Prompt");
  });

  it("does not render a library when authentication fails", async () => {
    queries.getMe.mockResolvedValue({ ok: false, error: "Authentication required" });
    const html = await render();
    expect(html).toContain("sesión");
    expect(html).not.toContain(prompt.description);
  });

  it("does not silently accept duplicate search parameters", async () => {
    queries.listPrompts.mockResolvedValue({ ok: false, error: "Invalid input" });
    expect(await render({ q: ["a", "b"] })).toContain("filtros");
  });

  it("uses a compact working directory instead of a promotional discovery panel", async () => {
    const html = await render();
    expect(html).not.toContain("discovery-panel");
    expect(html).not.toContain("Descubre tu próxima");
    expect(html).toContain('class="prompt-list"');
    expect(html).toContain('aria-label="Filtrar por Categoría"');
    expect(html).toContain('role="status"');
  });

  it("offers logout through the Easy Auth endpoint to every User", async () => {
    const html = await render();
    expect(html).toContain('href="/.auth/logout"');
    expect(html).toContain("Cerrar sesión");
  });

  it("makes administration discoverable only for Administrators", async () => {
    expect(await render()).not.toContain('href="/administration"');
    queries.getMe.mockResolvedValue({ ok: true, data: { name: "Ada", isAdministrator: true } });
    expect(await render()).toContain('href="/administration"');
  });
});
