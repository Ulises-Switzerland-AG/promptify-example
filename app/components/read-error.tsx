import Link from "next/link";

export function actionErrorMessage(error: string) {
  switch (error) {
    case "Invalid input": return "Revisa los campos obligatorios y sus límites antes de guardar.";
    case "Unknown Category": return "La Categoría seleccionada ya no está disponible. Recarga la página para elegir otra.";
    case "Category has Prompts": return "Esta Categoría contiene Prompts. Cambia su Categoría antes de eliminarla.";
    case "The change conflicts with existing data": return "El cambio entra en conflicto con los datos actuales. Comprueba que el nombre no esté en uso y recarga la página.";
    case "Category not found": return "Esta Categoría ya no existe. Recarga la página para actualizar la lista.";
    case "User not found": return "No encontramos ese Usuario. Comprueba el OID y que ya haya accedido a Promptify.";
    case "The last Administrator cannot be demoted": return "No puedes retirar el rol al último Administrador. Asigna otro primero.";
    default: return errorMessage(error);
  }
}

export function errorMessage(error: string) {
  switch (error) {
    case "Authentication required": return "Tu sesión no está disponible. Vuelve a acceder a Promptify.";
    case "You are not allowed to do this": return "No tienes permiso para acceder a este contenido.";
    case "Invalid input":
    case "Unknown Category": return "Los filtros no son válidos. Restablécelos para volver a la biblioteca.";
    case "Prompt not found": return "Este Prompt ya no está disponible. Puede que se haya eliminado.";
    default: return "No pudimos completar la solicitud. Inténtalo de nuevo en unos instantes.";
  }
}

export function ReadError({ error }: { error: string }) {
  return (
    <section className="empty-state error-state" role="alert">
      <h1>No pudimos cargar este contenido</h1>
      <p>{errorMessage(error)}</p>
      <Link href="/" className="button button-secondary">Volver a la biblioteca</Link>
    </section>
  );
}
