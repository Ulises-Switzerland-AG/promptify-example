import { test as base, type Page } from "@playwright/test";
import { openDatabase, type E2eDatabase } from "./db";
import { headersFor, type Persona } from "./identity";

type Fixtures = {
  db: E2eDatabase;
  // Opens a page with exactly these request headers (use `{}` for a request without Easy Auth principal).
  openPage: (headers: Record<string, string>) => Promise<Page>;
  // Opens a page whose requests carry the Easy Auth principal of `persona`.
  signIn: (persona: Persona) => Promise<Page>;
};

export const test = base.extend<Fixtures>({
  db: async ({}, use) => {
    const db = openDatabase();
    await use(db);
    await db.close();
  },
  openPage: async ({ browser }, use) => {
    const contexts: { close(): Promise<void> }[] = [];
    await use(async (headers) => {
      const context = await browser.newContext({ extraHTTPHeaders: headers });
      contexts.push(context);
      return context.newPage();
    });
    await Promise.all(contexts.map((context) => context.close()));
  },
  signIn: async ({ openPage }, use) => {
    await use((persona) => openPage(headersFor(persona)));
  },
});

export { expect } from "@playwright/test";
