import { describe, expect, it } from "vitest";
import { actionErrorMessage } from "@/app/components/read-error";

describe("Mutation feedback", () => {
  it.each([
    ["Category has Prompts", "contiene Prompts"],
    ["The change conflicts with existing data", "conflicto"],
    ["Category not found", "Categoría ya no existe"],
    ["User not found", "Comprueba el OID"],
    ["The last Administrator cannot be demoted", "último Administrador"],
    ["Invalid input", "campos"],
    ["Unknown Category", "seleccionada ya no está disponible"],
  ])("offers an actionable message for %s", (error, expected) => {
    expect(actionErrorMessage(error)).toContain(expected);
  });
});
