import { ADMINISTRATOR, AUTHOR, OTHER_USER, headersFor } from "./support/identity";
import { expect, test } from "./support/fixtures";
import { uniqueTag } from "./support/db";
import { MESSAGES, actionError, readError } from "./support/ui";

// Edit/Delete buttons per persona, authorship rules and input validation are covered by Vitest.
// Here: the boundaries hold across the real request path, including a submission whose identity differs from the page that was loaded.
test.describe("authorization", () => {
  for (const [label, persona] of [["another User", OTHER_USER], ["an Administrator", ADMINISTRATOR]] as const) {
    test(`${label} cannot edit someone else's Prompt`, async ({ signIn, db }) => {
      const tag = uniqueTag();
      const title = `Original ${tag}`;
      const { id } = await db.createPrompt({ author: AUTHOR, categories: ["writing"], title, content: "Contenido original" });
      try {
        const intruder = await signIn(persona);
        await intruder.goto(`/prompts/${id}`);
        await expect(intruder.getByRole("heading", { level: 1, name: title })).toBeVisible();
        await expect(intruder.getByRole("link", { name: "Editar Prompt" })).toHaveCount(0);

        await intruder.goto(`/prompts/${id}/edit`);
        await expect(readError(intruder)).toContainText(MESSAGES.notAllowed);
        await expect(intruder.getByRole("button", { name: "Guardar cambios" })).toHaveCount(0);

        // The form was loaded as the Author; the submission reaches the server with a different identity.
        const page = await signIn(AUTHOR);
        await page.goto(`/prompts/${id}/edit`);
        await page.getByLabel("Título").fill(`Manipulado ${tag}`);
        await page.getByLabel("Contenido del Prompt").fill("Contenido manipulado");
        await page.context().setExtraHTTPHeaders(headersFor(persona));
        await page.getByRole("button", { name: "Guardar cambios" }).click();

        await expect(actionError(page, MESSAGES.notAllowed)).toBeVisible();
        expect(await db.findPrompt({ id })).toMatchObject({ title, content: "Contenido original", authorOid: AUTHOR.oid });
      } finally {
        await db.deletePromptsTagged(tag);
      }
    });
  }

  test("only the Author or an Administrator can delete a Prompt", async ({ signIn, db }) => {
    const tag = uniqueTag();
    const { id } = await db.createPrompt({ author: AUTHOR, categories: ["writing"], title: `Intocable ${tag}` });
    try {
      const other = await signIn(OTHER_USER);
      await other.goto(`/prompts/${id}`);
      await expect(other.getByRole("heading", { level: 1, name: `Intocable ${tag}` })).toBeVisible();
      await expect(other.getByRole("button", { name: "Eliminar Prompt" })).toHaveCount(0);

      // The confirmation was opened as the Author; the submission reaches the server as another User.
      const page = await signIn(AUTHOR);
      await page.goto(`/prompts/${id}`);
      await page.getByRole("button", { name: "Eliminar Prompt" }).click();
      await page.context().setExtraHTTPHeaders(headersFor(OTHER_USER));
      await page.getByRole("button", { name: "Confirmar eliminación" }).click();

      await expect(actionError(page, MESSAGES.notAllowed)).toBeVisible();
      expect(await db.findPrompt({ id })).not.toBeNull();

      const administrator = await signIn(ADMINISTRATOR);
      await administrator.goto(`/prompts/${id}`);
      await administrator.getByRole("button", { name: "Eliminar Prompt" }).click();
      await administrator.getByRole("button", { name: "Confirmar eliminación" }).click();

      await expect.poll(() => db.findPrompt({ id })).toBeNull();
    } finally {
      await db.deletePromptsTagged(tag);
    }
  });
});
