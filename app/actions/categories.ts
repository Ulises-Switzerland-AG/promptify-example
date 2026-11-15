"use server";

import { getContainer } from "@/lib/container";

export async function createCategory(form: FormData) {
  return getContainer().actions.createCategory(form);
}

export async function updateCategory(id: string, form: FormData) {
  return getContainer().actions.updateCategory(id, form);
}

export async function deleteCategory(id: string) {
  return getContainer().actions.deleteCategory(id);
}
