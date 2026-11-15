import "server-only";
import { headers } from "next/headers";
import { PrismaUserRepository } from "@/lib/repositories/prisma/user-repository";
import { getPrismaClient } from "@/lib/repositories/prisma/client";
import type { CurrentUser } from "@/lib/services/types";
import { readPrincipalFromHeaders } from "./principal";
import { resolveUser } from "./resolve-user";

// Request-time only: never call these from a cached scope ("use cache").
export async function readPrincipal() {
  return readPrincipalFromHeaders(await headers(), {
    nodeEnv: process.env.NODE_ENV,
    devUserOid: process.env.PROMPTIFY_DEV_USER_OID,
    devUserName: process.env.PROMPTIFY_DEV_USER_NAME,
  });
}

export async function getCurrentUser(): Promise<CurrentUser> {
  return resolveUser(new PrismaUserRepository(getPrismaClient()), await readPrincipal());
}
