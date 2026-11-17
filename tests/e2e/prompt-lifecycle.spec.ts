import { AUTHOR } from "./support/identity";
import { expect, test } from "./support/fixtures";
import { uniqueTag } from "./support/db";
import { MESSAGES, promptRow, readError, searchLibrary } from "./support/ui";

test.describe("Prompt lifecycle", () => {
  test("an Author creates, edits and deletes a Prompt", async ({ signIn, db }) => {
    const tag = uniqueTag();
    const title = `Resumen de reuniones ${tag}`;
    const editedTitle = `Resumen editado ${tag}`;
    try {
      const page = await signIn(AUTHOR);

      // Create: from the library, in the modal.
      await page.goto("/");
      await page.getByRole("link", { name: "Crear Prompt" }).click();
      const creation = page.getByRole("dialog", { name: "Crear Prompt" });
      await creation.getByLabel("Título").fill(title);
      await creation.getByLabel("Descripción").fill("Resume una reunión en puntos de acción.");
      await creation.getByLabel("Contenido del Prompt").fill("Resume la siguiente reunión en cinco puntos.");
      await creation.getByLabel("E2E Writing").check();
      await creation.getByLabel("E2E Code").check();
      await creation.getByRole("button", { name: "Publicar Prompt" }).click();

      const published = page.getByRole("dialog", { name: title });
      await expect(published).toBeVisible();
      await expect(published).toContainText("Por Ana E2E");
      await expect(published).toContainText("Resume la siguiente reunión en cinco puntos.");

      const created = await db.findPrompt({ titleContains: tag });
      expect(created).toMatchObject({ title, authorOid: AUTHOR.oid, description: "Resume una reunión en puntos de acción." });

      // The new Prompt shows up in the library with its Categories.
      await published.getByRole("button", { name: "Cerrar Prompt" }).click();
      await expect(page.getByRole("dialog")).toHaveCount(0);
      await expect(promptRow(page, title)).toContainText("E2E Writing");
      await expect(promptRow(page, title)).toContainText("E2E Code");

      // Edit: everything is checked in the same tab, so a broken navigation after saving fails the test.
      await page.goto(`/prompts/${created!.id}`);
      await page.getByRole("link", { name: "Editar Prompt" }).click();
      await page.getByLabel("Título").fill(editedTitle);
      await page.getByLabel("Contenido del Prompt").fill("Texto nuevo del Prompt.");
      await page.getByLabel("E2E Code").uncheck();
      await page.getByRole("button", { name: "Guardar cambios" }).click();

      await expect(page).not.toHaveURL(/\/edit/);
      await expect(page.getByRole("heading", { level: 1, name: editedTitle })).toBeVisible();
      await expect(page.getByRole("button", { name: "Guardar cambios" })).toHaveCount(0);
      expect(await db.findPrompt({ id: created!.id })).toMatchObject({ title: editedTitle, content: "Texto nuevo del Prompt.", authorOid: AUTHOR.oid });

      // Delete: with confirmation, and the User lands back in the library without the Prompt.
      await page.getByRole("button", { name: "Eliminar Prompt" }).click();
      const confirmation = page.getByRole("dialog", { name: "¿Eliminar este Prompt?" });
      await expect(confirmation).toContainText(editedTitle);
      await confirmation.getByRole("button", { name: "Confirmar eliminación" }).click();

      await expect(page.getByRole("heading", { name: "Biblioteca de Prompts" })).toBeVisible();
      await expect(page).not.toHaveURL(/\/prompts\//);
      await searchLibrary(page, tag);
      await expect(page.getByText(MESSAGES.noResults)).toBeVisible();
      expect(await db.findPrompt({ id: created!.id })).toBeNull();

      await page.goto(`/prompts/${created!.id}`);
      await expect(readError(page)).toContainText(MESSAGES.promptGone);
    } finally {
      await db.deletePromptsTagged(tag);
    }
  });
});

