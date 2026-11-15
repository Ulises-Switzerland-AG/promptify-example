import "server-only";
import { PrismaMssql } from "@prisma/adapter-mssql";
import { PrismaClient } from "@/lib/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export function getPrismaClient() {
  if (!globalForPrisma.prisma) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is required");
    globalForPrisma.prisma = new PrismaClient({ adapter: new PrismaMssql(url) });
  }
  return globalForPrisma.prisma;
}

export type { PrismaClient };
