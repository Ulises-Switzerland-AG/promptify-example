import Link from "next/link";
import { connection } from "next/server";
import { getContainer } from "@/lib/container";
import { Brand } from "@/app/components/brand";
import { Icon } from "@/app/components/ui-icon";
import { PromptForm } from "@/app/components/prompt-form";
import { ReadError } from "@/app/components/read-error";
import { PromptModal } from "./prompt-modal";
import type { PromptRouteProps } from "./prompt-detail";

export async function PromptCreator({ searchParams, modal = false }: Pick<PromptRouteProps, "searchParams"> & { modal?: boolean } = {}) {
  await connection();
  const { from } = searchParams ? await searchParams : {};
  const validFrom = from === undefined || (typeof from === "string" && (from === "/" || from.startsWith("/?")));
  const libraryHref = validFrom && typeof from === "string" ? from : "/";
  const failure = (error: string) => modal
    ? <PromptModal title="Crear Prompt" libraryHref={libraryHref}><ReadError error={error} /></PromptModal>
    : <ReadError error={error} />;
  if (!validFrom) return failure("Invalid input");
  const { queries } = getContainer();
  const [me, categories] = await Promise.all([queries.getMe(), queries.listCategories()]);
  if (!me.ok) return failure(me.error);
  if (!categories.ok) return failure(categories.error);
  const content = <>
    {!modal && <h1>Tu próximo Prompt puede ayudar a alguien.</h1>}
    <p className="detail-description">Comparte lo que te funciona. Tú serás su Autor y podrás editarlo.</p>
    {categories.data.length > 0
      ? <PromptForm categories={categories.data} returnHref={libraryHref} />
      : <section className="empty-state"><h2>Necesitamos una Categoría para empezar</h2><p>Pide a un Administrador que cree una Categoría antes de publicar tu primer Prompt.</p><Link className="button button-secondary" href={libraryHref} scroll={false}>Volver a la biblioteca</Link></section>}
  </>;
  if (modal) return <PromptModal title="Crear Prompt" libraryHref={libraryHref}>{content}</PromptModal>;
  return (
    <div className="supporting-page">
      <header className="supporting-header"><Brand /><Link className="text-link" href={libraryHref}><Icon name="back" /> Biblioteca</Link></header>
      <main className="creation-content">{content}</main>
    </div>
  );
}
