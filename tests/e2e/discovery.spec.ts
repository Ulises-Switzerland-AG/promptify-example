import { AUTHOR, OTHER_USER } from "./support/identity";
import { expect, test } from "./support/fixtures";
import { uniqueTag } from "./support/db";
import { categoryFilter, promptRow, promptRows, searchLibrary } from "./support/ui";

const PAGE_SIZE = 12;
const MINUTE = 60_000;

test.describe("discovering Prompts", () => {
  test("search and Category filters combine, and they live in the URL", async ({ signIn, db }) => {
    const tag = uniqueTag();
    try {
      await db.createPrompt({ author: AUTHOR, categories: ["writing"], title: `Escritura ${tag}` });
      await db.createPrompt({ author: AUTHOR, categories: ["code"], title: `Codigo ${tag}` });
      await db.createPrompt({ author: AUTHOR, categories: ["data"], title: `Datos ${tag}`, content: `Texto con ${tag}contenido` });
      const page = await signIn(OTHER_USER);
      await page.goto("/");

      // Search also looks into the content.
      await searchLibrary(page, `${tag}contenido`);
      await expect(promptRows(page)).toHaveCount(1);
      await expect(promptRows(page)).toContainText(`Datos ${tag}`);

      await searchLibrary(page, tag);
      await expect(promptRows(page)).toHaveCount(3);

      // A Prompt matches when it has any of the selected Categories.
      await categoryFilter(page, "E2E Writing").check();
      await expect(promptRows(page)).toHaveCount(1);
      await categoryFilter(page, "E2E Code").check();
      await expect(promptRows(page)).toHaveCount(2);
      await expect(promptRow(page, `Datos ${tag}`)).toHaveCount(0);

      // The state is in the URL, so it survives a reload.
      const [codeId, writingId] = await db.categoryIds("code", "writing");
      await expect(page).toHaveURL(new RegExp(`q=${tag}`));
      await expect(page).toHaveURL(new RegExp(`categoryId=(${codeId}|${writingId})`));
      await page.reload();
      await expect(promptRows(page)).toHaveCount(2);
      await expect(categoryFilter(page, "E2E Writing")).toBeChecked();
      await expect(categoryFilter(page, "E2E Code")).toBeChecked();
    } finally {
      await db.deletePromptsTagged(tag);
    }
  });

  test("the library paginates, and search reaches Prompts outside the current page", async ({ signIn, db }) => {
    const tag = uniqueTag();
    const total = PAGE_SIZE + 1;
    const oldest = `Lote 00 ${tag}`;
    const start = Date.now() - total * MINUTE;
    try {
      for (let index = 0; index < total; index++) {
        await db.createPrompt({
          author: AUTHOR,
          categories: ["writing"],
          title: `Lote ${String(index).padStart(2, "0")} ${tag}`,
          // The oldest Prompt is the only one with this word, and with fixed dates it falls on page 2.
          content: index === 0 ? `${tag}antiguo` : "Contenido",
          createdAt: new Date(start + index * MINUTE),
        });
      }
      const page = await signIn(OTHER_USER);
      await page.goto("/");
      await searchLibrary(page, tag);

      await expect(promptRows(page)).toHaveCount(PAGE_SIZE);
      await expect(promptRow(page, oldest)).toHaveCount(0);

      await page.getByRole("link", { name: "Siguiente" }).click();
      await expect(promptRows(page)).toHaveCount(1);
      await expect(promptRow(page, oldest)).toHaveCount(1);

      await page.reload();
      await expect(promptRow(page, oldest)).toHaveCount(1);

      await searchLibrary(page, `${tag}antiguo`);
      await expect(promptRows(page)).toHaveCount(1);
      await expect(promptRow(page, oldest)).toHaveCount(1);
    } finally {
      await db.deletePromptsTagged(tag);
    }
  });
});
