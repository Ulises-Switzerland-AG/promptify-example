import { randomUUID } from "node:crypto";
import { principalHeader, AUTHOR } from "./support/identity";
import { expect, test } from "./support/fixtures";
import { uniqueTag } from "./support/db";
import { currentUser, readError, MESSAGES } from "./support/ui";

// Every malformed variant is covered by tests/lib/identity/principal.test.ts; here only the end-to-end rejection.
const rejected: [string, (oid: string) => Record<string, string>, string][] = [
  ["a request without principal", () => ({}), MESSAGES.sessionUnavailable],
  ["a malformed principal", () => ({ "x-ms-client-principal": "%%%no-es-base64%%%" }), MESSAGES.sessionUnavailable],
  ["a guest that is not a tenant member", (oid) => ({ "x-ms-client-principal": principalHeader({ oid, name: "Invitado", acct: "1" }) }), MESSAGES.notAllowed],
];

test.describe("identity and access", () => {
  for (const [label, headers, message] of rejected) {
    test(`${label} is rejected: no library, no Prompts, no User created`, async ({ openPage, db }) => {
      const tag = uniqueTag();
      const oid = randomUUID();
      await db.createPrompt({ author: AUTHOR, categories: ["writing"], title: `Secreto ${tag}` });
      try {
        const page = await openPage(headers(oid));
        await page.goto("/");

        await expect(readError(page)).toContainText(message);
        await expect(page.getByRole("heading", { name: "Biblioteca de Prompts" })).toHaveCount(0);
        await expect(page.locator("body")).not.toContainText(tag);
        expect(await db.findUser(oid)).toBeNull();
      } finally {
        await db.deletePromptsTagged(tag);
      }
    });
  }

  test("the first visit of a member creates the User and later visits refresh the display name", async ({ openPage, db }) => {
    const oid = randomUUID();
    try {
      expect(await db.findUser(oid)).toBeNull();

      const first = await openPage({ "x-ms-client-principal": principalHeader({ oid, name: "Nuria Nueva" }) });
      await first.goto("/");
      await expect(currentUser(first)).toContainText("Nuria Nueva");
      await expect(currentUser(first)).toContainText("Usuario");
      await expect(first.getByRole("link", { name: "Administración" })).toHaveCount(0);
      expect(await db.findUser(oid)).toMatchObject({ displayName: "Nuria Nueva", isAdministrator: false });

      const renamed = await openPage({ "x-ms-client-principal": principalHeader({ oid, name: "Nuria Renombrada" }) });
      await renamed.goto("/");
      await expect(currentUser(renamed)).toContainText("Nuria Renombrada");
      expect(await db.findUser(oid)).toMatchObject({ displayName: "Nuria Renombrada" });
    } finally {
      await db.deleteUser(oid);
    }
  });
});
