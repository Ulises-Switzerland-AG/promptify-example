"use client";

import { useActionState, useRef } from "react";
import { useRouter } from "next/navigation";
import { deletePrompt } from "@/app/actions/prompts";
import { errorMessage } from "./read-error";
import { Icon } from "./ui-icon";

export function DeletePrompt({ id, title, libraryHref, iconOnly = false }: { id: string; title: string; libraryHref: string; iconOnly?: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const [error, submit, pending] = useActionState(async () => {
    const result = await deletePrompt(id);
    if (!result.ok) return errorMessage(result.error);
    dialog.current?.close();
    router.replace(libraryHref, { scroll: false });
    return null;
  }, null);

  return <>
    <button className={`button button-danger-secondary${iconOnly ? " icon-button" : ""}`} type="button" aria-label="Eliminar Prompt" title="Eliminar Prompt" onClick={() => dialog.current?.showModal()}>{iconOnly ? <Icon name="trash" /> : "Eliminar Prompt"}</button>
    <dialog ref={dialog} className="confirmation-dialog" aria-labelledby="delete-title" aria-describedby="delete-description" onCancel={(event) => { if (pending) event.preventDefault(); }}>
      <h2 id="delete-title">¿Eliminar este Prompt?</h2>
      <p id="delete-description">«{title}» se eliminará para todos los Usuarios. Esta acción no se puede deshacer.</p>
      <form action={submit} aria-busy={pending}>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="form-actions">
          <button type="button" className="button button-secondary" autoFocus disabled={pending} onClick={() => dialog.current?.close()}>Cancelar</button>
          <button type="submit" className="button button-danger" disabled={pending}>{pending ? "Eliminando…" : "Confirmar eliminación"}</button>
        </div>
      </form>
    </dialog>
  </>;
}
