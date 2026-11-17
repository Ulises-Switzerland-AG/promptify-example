import { ADMINISTRATOR, OTHER_USER, headersFor } from "./support/identity";
import { expect, test } from "./support/fixtures";
import { uniqueTag } from "./support/db";
import { MESSAGES, actionError, currentUser, readError } from "./support/ui";

test.describe("administration", () => {
  test("an Administrator manages Categories", async ({ signIn, db }) => {
    const tag = uniqueTag();
    const name = `Cat ${tag}`;
    const renamed = `Ren ${tag}`;
    try {
      const page = await signIn(ADMINISTRATOR);
      await page.goto("/");
      await expect(currentUser(page)).toContainText("Administrador");
      await page.getByRole("link", { name: "Administración" }).first().click();
      await expect(page.getByRole("heading", { level: 1, name: "Administración" })).toBeVisible();

      const creation = page.getByRole("form", { name: "Crear Categoría" });
      await creation.getByLabel("Nombre").fill(name);
      await creation.getByRole("button", { name: "Crear Categoría" }).click();
      await expect(page.getByRole("status").filter({ hasText: "Categoría creada." })).toBeVisible();
      expect(await db.findCategory(name)).not.toBeNull();

      await page.reload();
      const edition = page.getByRole("form", { name: `Editar Categoría ${name}` });
      await edition.getByLabel("Nombre").fill(renamed);
      await edition.getByRole("button", { name: "Guardar Categoría" }).click();
      await expect(page.getByRole("status").filter({ hasText: "Categoría guardada." })).toBeVisible();
      expect(await db.findCategory(renamed)).not.toBeNull();
      expect(await db.findCategory(name)).toBeNull();

      await page.reload();
      await page.getByRole("form", { name: `Editar Categoría ${renamed}` }).getByRole("button", { name: "Eliminar Categoría" }).click();
      await page.getByRole("dialog", { name: `¿Eliminar «${renamed}»?` }).getByRole("button", { name: "Confirmar eliminación" }).click();
      await expect.poll(() => db.findCategory(renamed)).toBeNull();
    } finally {
      await db.deleteCategoriesTagged(tag);
    }
  });

  test("a User who is not an Administrator cannot reach or change Categories", async ({ signIn, db }) => {
    const tag = uniqueTag();
    const name = `Cat ${tag}`;
    try {
      const user = await signIn(OTHER_USER);
      await user.goto("/");
      await expect(user.getByRole("link", { name: "Administración" })).toHaveCount(0);
      await user.goto("/administration");
      await expect(readError(user)).toContainText(MESSAGES.notAllowed);

      // The page was loaded as an Administrator; the submission reaches the server as a regular User.
      const page = await signIn(ADMINISTRATOR);
      await page.goto("/administration");
      const creation = page.getByRole("form", { name: "Crear Categoría" });
      await creation.getByLabel("Nombre").fill(name);
      await page.context().setExtraHTTPHeaders(headersFor(OTHER_USER));
      await creation.getByRole("button", { name: "Crear Categoría" }).click();

      await expect(actionError(page, MESSAGES.notAllowed)).toBeVisible();
      expect(await db.findCategory(name)).toBeNull();
    } finally {
      await db.deleteCategoriesTagged(tag);
    }
  });
});
