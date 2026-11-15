import { createAuditLog } from "@/lib/audit/application-insights";
import { getPrismaClient } from "@/lib/repositories/prisma/client";
import { PrismaUserRepository } from "@/lib/repositories/prisma/user-repository";
import { runSeed } from "@/lib/seed/run-seed";

async function main() {
  const client = getPrismaClient();
  try {
    await runSeed({
      env: process.env,
      users: new PrismaUserRepository(client),
      createAudit: createAuditLog,
      now: () => new Date(),
    });
  } finally {
    await client.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Seed failed");
  process.exit(1);
});
