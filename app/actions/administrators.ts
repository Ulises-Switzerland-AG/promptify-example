"use server";

import { getContainer } from "@/lib/container";

export async function promoteAdministrator(oid: string) {
  return getContainer().actions.promoteAdministrator(oid);
}

export async function demoteAdministrator(oid: string) {
  return getContainer().actions.demoteAdministrator(oid);
}
