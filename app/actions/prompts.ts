"use server";

import { getContainer } from "@/lib/container";

// Server Actions are public POST endpoints: each one resolves the principal and validates by itself.

export async function createPrompt(form: FormData) {
  return getContainer().actions.createPrompt(form);
}

export async function updatePrompt(id: string, form: FormData) {
  return getContainer().actions.updatePrompt(id, form);
}

export async function deletePrompt(id: string) {
  return getContainer().actions.deletePrompt(id);
}
