"use client";

import { useActionState, useRef, useState } from "react";
import type { AdministratorUserDto, CategoryDto } from "@/lib/dto/dtos";
import { createCategory, updateCategory, deleteCategory } from "@/app/actions/categories";
import { promoteAdministrator, demoteAdministrator } from "@/app/actions/administrators";
import { actionErrorMessage } from "./read-error";

type Feedback = { error?: string; success?: string } | null;

function FormFeedback({ feedback }: { feedback: Feedback }) {
  return <>{feedback?.error && <p className="form-error" role="alert">{feedback.error}</p>}
    {feedback?.success && <p className="form-success" role="status">{feedback.success}</p>}</>;
}

export function CategoryForm({ category }: { category?: CategoryDto }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const suffix = category?.id ?? "new";
  const [values, setValues] = useState({ name: category?.name ?? "", color: category?.color ?? "#28745a" });
  const [feedback, submit, pending] = useActionState<Feedback, FormData>(async (_previous, form) => {
    const deleting = form.get("intent") === "delete";
    const result = deleting && category ? await deleteCategory(category.id)
      : category ? await updateCategory(category.id, form) : await createCategory(form);
    if (!result.ok) return { error: actionErrorMessage(result.error) };
    dialog.current?.close();
    if (!category) setValues({ name: "", color: "#28745a" });
    return { success: deleting ? "Categoría eliminada." : category ? "Categoría guardada." : "Categoría creada." };
  }, null);
  return <div className="category-management">
    <form action={submit} className="category-management-form" aria-label={category ? `Editar Categoría ${category.name}` : "Crear Categoría"} aria-busy={pending}>
      <div className="form-field">
        <label htmlFor={`category-name-${suffix}`}>Nombre</label>
        <input id={`category-name-${suffix}`} name="name" required maxLength={50} value={values.name} onChange={(event) => setValues({ ...values, name: event.target.value })} disabled={pending} placeholder="Nombre de la Categoría" />
      </div>
      <div className="form-field color-field">
        <label htmlFor={`category-color-${suffix}`}>Color</label>
        <input id={`category-color-${suffix}`} name="color" type="color" value={values.color} onChange={(event) => setValues({ ...values, color: event.target.value })} disabled={pending} required />
      </div>
      <button type="submit" className={`button ${category ? "button-secondary" : "button-primary"}`} disabled={pending}>{pending ? "Guardando…" : category ? "Guardar Categoría" : "Crear Categoría"}</button>
      {category && <button className="button button-danger-secondary" type="button" disabled={pending} onClick={() => dialog.current?.showModal()}>Eliminar Categoría</button>}
    </form>
    <FormFeedback feedback={feedback} />
    {category && <dialog ref={dialog} className="confirmation-dialog" aria-labelledby={`delete-category-${suffix}`} onCancel={(event) => { if (pending) event.preventDefault(); }}>
      <h2 id={`delete-category-${suffix}`}>¿Eliminar «{category.name}»?</h2>
      <p>No se puede deshacer. Si contiene Prompts, no se eliminará.</p>
      <FormFeedback feedback={feedback?.error ? feedback : null} />
      <form action={submit} className="form-actions">
        <button className="button button-secondary" type="button" autoFocus disabled={pending} onClick={() => dialog.current?.close()}>Cancelar</button>
        <button className="button button-danger" name="intent" value="delete" disabled={pending}>{pending ? "Eliminando…" : "Confirmar eliminación"}</button>
      </form>
    </dialog>}
  </div>;
}

export function AdministratorForm({ users }: { users: AdministratorUserDto[] }) {
  return <ul className="role-management-list" aria-label="Usuarios y roles">
    {users.map((user) => <AdministratorUserRow key={user.oid} user={user} />)}
  </ul>;
}

function AdministratorUserRow({ user }: { user: AdministratorUserDto }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [feedback, submit, pending] = useActionState<Feedback, FormData>(async (_previous, form) => {
    const oid = String(form.get("oid") ?? "").trim();
    const demoting = form.get("intent") === "demote";
    const result = demoting ? await demoteAdministrator(oid) : await promoteAdministrator(oid);
    if (!result.ok) return { error: actionErrorMessage(result.error) };
    dialog.current?.close();
    return { success: demoting ? "Rol de Administrador retirado." : "Rol de Administrador asignado." };
  }, null);
  const dialogId = `demote-user-${user.oid}`;
  return <li className="role-management-row">
    <div className="role-user-details">
      <strong>{user.name}</strong>
      <span className={`role-badge ${user.isAdministrator ? "role-badge-administrator" : "role-badge-user"}`}>
        {user.isAdministrator ? "Administrador" : "Usuario"}
      </span>
    </div>
    <form action={submit} className="role-user-actions" aria-busy={pending}>
      <input type="hidden" name="oid" value={user.oid} />
      {user.isAdministrator
        ? <button className="button button-danger-secondary" type="button" disabled={pending} onClick={() => dialog.current?.showModal()} aria-label={`Retirar el rol de Administrador a ${user.name}`}>Retirar rol</button>
        : <button className="button button-primary" type="submit" name="intent" value="promote" disabled={pending} aria-label={`Asignar el rol de Administrador a ${user.name}`}>{pending ? "Actualizando…" : "Asignar Administrador"}</button>}
      <FormFeedback feedback={feedback} />
      {user.isAdministrator && <dialog ref={dialog} className="confirmation-dialog" aria-labelledby={`${dialogId}-title`} onCancel={(event) => { if (pending) event.preventDefault(); }}>
        <h2 id={`${dialogId}-title`}>¿Retirar el rol de Administrador a {user.name}?</h2>
        <p>{user.name} dejará de gestionar Categorías y roles. El último Administrador no puede perder su rol.</p>
        <FormFeedback feedback={feedback?.error ? feedback : null} />
        <div className="form-actions">
          <button className="button button-secondary" type="button" autoFocus disabled={pending} onClick={() => dialog.current?.close()}>Cancelar</button>
          <button className="button button-danger" type="submit" name="intent" value="demote" disabled={pending}>{pending ? "Actualizando…" : "Retirar rol"}</button>
        </div>
      </dialog>}
    </form>
  </li>;
}
