import { defineConfig } from "prisma/config";

// Used by the Prisma CLI only (migrations, run by the pipeline with the migration login).
// The runtime uses DATABASE_URL, a different login without DDL permissions.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: process.env.MIGRATION_DATABASE_URL ?? "" },
});
