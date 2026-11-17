import { expect, type Page } from "@playwright/test";

export const MESSAGES = {
  sessionUnavailable: "Tu sesión no está disponible. Vuelve a acceder a Promptify.",
  notAllowed: "No tienes permiso para acceder a este contenido.",
  promptGone: "Este Prompt ya no está disponible. Puede que se haya eliminado.",
  noResults: "No encontramos Prompts con estos filtros",
};

// The server-rendered read error. Next.js has its own `role="alert"` route announcer, so filter by content.
export const readError = (page: Page) => page.getByRole("alert").filter({ hasText: "No pudimos cargar este contenido" });

// An error announced by a form or dialog after a rejected action. Same content filter as `readError`.
export const actionError = (page: Page, message: string) => page.getByRole("alert").filter({ hasText: message });

// The sidebar shows the signed-in User's name and role.
export const currentUser = (page: Page) => page.getByRole("complementary");

// Each Prompt in the library list is the only `article` on the page.
export const promptRows = (page: Page) => page.getByRole("article");

export const promptRow = (page: Page, title: string) => promptRows(page).filter({ hasText: title });

export const categoryFilter = (page: Page, name: string) =>
  page.getByRole("navigation", { name: "Filtrar por Categoría" }).getByLabel(name);

// Waits for the search to be applied (it lives in the URL), so later assertions never read the previous results.
export async function searchLibrary(page: Page, text: string) {
  await page.getByRole("searchbox", { name: "Buscar Prompts" }).fill(text);
  await page.getByRole("button", { name: "Buscar", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`[?&]q=${encodeURIComponent(text)}(&|$)`));
}
