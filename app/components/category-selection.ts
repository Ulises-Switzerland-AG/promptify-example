export function categorySelectionError(form: FormData) {
  return form.getAll("categoryId").length ? null : "Elige al menos una Categoría.";
}
