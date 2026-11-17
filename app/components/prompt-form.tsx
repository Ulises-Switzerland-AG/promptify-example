"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createPrompt, updatePrompt } from "@/app/actions/prompts";
import type { CategoryDto, PromptDetailDto } from "@/lib/dto/dtos";
import { actionErrorMessage } from "./read-error";
import { CategoryPicker } from "./category-picker";
import { categorySelectionError } from "./category-selection";

export function PromptForm({ categories, prompt, returnHref = "/", modal = false }: {
  categories: CategoryDto[]; prompt?: PromptDetailDto; returnHref?: string; modal?: boolean;
}) {
  const router = useRouter();
  const [values, setValues] = useState({
    title: prompt?.title ?? "", description: prompt?.description ?? "",
    categoryIds: prompt?.categoryIds ?? [] as string[], content: prompt?.content ?? "",
  });
  const [error, submit, pending] = useActionState(async (_previous: string | null, form: FormData) => {
    const selectionError = categorySelectionError(form);
    if (selectionError) return selectionError;
    const result = prompt
      ? await updatePrompt(prompt.id, form).then((result) => result.ok ? { ok: true as const, data: { id: prompt.id } } : result)
      : await createPrompt(form);
    if (!result.ok) {
      return actionErrorMessage(result.error);
    }
    const destination = prompt ? returnHref : `/prompts/${result.data.id}?from=${encodeURIComponent(returnHref)}`;
    // A client navigation to the Prompt URL is intercepted by the `@modal` route, which would open it as a modal over this
    // full page's form. Only the modal flow wants that; a full page leaves with a regular navigation.
    if (modal) router.replace(destination, { scroll: false });
    else window.location.replace(destination);
    return null;
  }, null);

  return (
    <form action={submit} className="prompt-form" aria-busy={pending}>
      <div className="form-field">
        <label htmlFor="title">Título <span>Obligatorio</span></label>
        <input
          id="title" name="title" required maxLength={120}
          value={values.title}
          onChange={(event) => setValues({ ...values, title: event.target.value })}
          placeholder="Un nombre claro para lo que hace tu Prompt"
        />
      </div>
      <div className="form-field">
        <label htmlFor="description">Descripción <span>Opcional</span></label>
        <textarea
          id="description" name="description" rows={2} maxLength={500}
          value={values.description}
          onChange={(event) => setValues({ ...values, description: event.target.value })}
          placeholder="Explica cuándo resulta útil y qué se puede conseguir."
        />
      </div>
      <CategoryPicker
        categories={categories} selected={values.categoryIds}
        onChange={(categoryIds) => setValues({ ...values, categoryIds })}
      />
      <div className="form-field">
        <label htmlFor="content">Contenido del Prompt <span>Obligatorio</span></label>
        <textarea
          className="content-input" id="content" name="content" rows={10} required maxLength={10000}
          value={values.content}
          onChange={(event) => setValues({ ...values, content: event.target.value })}
          placeholder="Escribe el texto completo que otros Usuarios podrán copiar."
          aria-describedby="content-warning"
        />
      </div>
      <p id="content-warning" className="content-warning">Todos los Usuarios podrán ver este Prompt. No incluyas secretos ni datos personales.</p>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="form-actions">
        <Link href={returnHref} replace={Boolean(prompt)} scroll={false} className="button button-secondary" aria-disabled={pending} onNavigate={(event) => { if (pending) event.preventDefault(); }}>Cancelar</Link>
        <button className="button button-primary" disabled={pending} type="submit">
          {prompt ? pending ? "Guardando…" : "Guardar cambios" : pending ? "Publicando…" : "Publicar Prompt"}
        </button>
      </div>
    </form>
  );
}
