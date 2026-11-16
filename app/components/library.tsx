"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOptimistic, useState, useTransition, type ReactNode } from "react";
import type { CategoryDto, MeDto, PromptListDto } from "@/lib/dto/dtos";
import { MAX_FILTER_CATEGORIES } from "@/lib/schemas/category-limits";
import { Brand } from "./brand";
import { CategoryBadges } from "./category-badges";
import { categoryHeading, libraryUrl, toggleCategory } from "./library-url";
import { LogoutLink } from "./logout-link";
import { syncSearchDraft, type SearchDraft } from "./search-draft";
import { Icon } from "./ui-icon";

const VISIBLE_BADGES = 3;

export function Library({ me, categories, prompts, q, categoryIds }: {
  me: MeDto; categories: CategoryDto[]; prompts: PromptListDto; q: string; categoryIds: string[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  // Checkboxes answer immediately; the URL (and with it `categoryIds`) catches up when navigation ends.
  const [selectedIds, setSelectedIds] = useOptimistic(categoryIds);
  const [searchState, setSearchState] = useState<SearchDraft>({ draft: q, appliedQ: q });
  const synced = syncSearchDraft(searchState, q);
  if (synced !== searchState) setSearchState(synced);
  const { draft } = synced;
  // Category changes apply the text visible in the search box, not a stale applied search.
  const visibleQ = draft.trim();
  const navigate = (href: string) => {
    const target = new URL(href, "http://x").searchParams;
    setSearchState({ draft: target.get("q") ?? "", appliedQ: q });
    startTransition(() => {
      setSelectedIds(target.getAll("categoryId"));
      router.push(href, { scroll: false });
    });
  };
  const toggle = (id: string) => {
    navigate(libraryUrl({ q: visibleQ, categoryIds: toggleCategory(selectedIds, id), page: 1 }));
  };
  const selectedCategories = categories.filter((category) => selectedIds.includes(category.id));
  const selectionFull = selectedIds.length >= MAX_FILTER_CATEGORIES;
  const { items, total, page, pageSize } = prompts;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const filtered = Boolean(q || categoryIds.length);
  const initials = me.name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("");
  const origin = libraryUrl({ q, categoryIds, page });
  const creationHref = `/prompts/new?from=${encodeURIComponent(origin)}`;
  const filterLink = (href: string, children: ReactNode, className: string, selected = false) => (
    <Link href={href} scroll={false} className={className} aria-current={selected ? "page" : undefined}
      onNavigate={(event) => { event.preventDefault(); navigate(href); }}>
      {children}
    </Link>
  );
  const categoryCheckbox = (category: CategoryDto, className: string) => {
    const checked = selectedIds.includes(category.id);
    return (
      <label key={category.id} className={`${className} ${checked ? "is-selected" : ""}`}>
        <input type="checkbox" checked={checked} disabled={!checked && selectionFull} onChange={() => toggle(category.id)} />
        <span className="category-dot" style={{ backgroundColor: category.color }} />{category.name}
      </label>
    );
  };

  return (
    <div className="library-app">
      <a href="#main" className="skip-link">Saltar al contenido</a>
      <aside className="sidebar">
        <Brand />
        <div className="sidebar-content">
          <nav aria-label="Biblioteca">
            {filterLink("/", <><Icon name="library" /> Biblioteca</>, "sidebar-discover", !filtered)}
          </nav>
          <nav className="category-nav" aria-label="Filtrar por Categoría">
            <h2>Categorías</h2>
            {filterLink(libraryUrl({ q: visibleQ, categoryIds: [], page: 1 }), <><span className="all-categories-dot" /> Todas las Categorías</>, `category-link ${!selectedIds.length ? "is-selected" : ""}`, !selectedIds.length)}
            {categories.map((category) => categoryCheckbox(category, "category-link"))}
            {!categories.length && <p className="sidebar-hint">Aún no hay Categorías.</p>}
          </nav>
          {me.isAdministrator && <Link href="/administration" className="administration-link"><Icon name="shield" /> Administración</Link>}
        </div>
        <div className="user-profile">
          <span className="avatar">{initials}</span>
          <div><strong>{me.name}</strong><span>{me.isAdministrator ? "Administrador" : "Usuario"}</span></div>
          <LogoutLink />
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="mobile-brand"><Brand /></div>
          <span className="workspace-name">Biblioteca interna</span>
          <div className="topbar-actions">
            {me.isAdministrator && <Link href="/administration" className="mobile-administration">Administración</Link>}
            <LogoutLink className="mobile-logout" />
            <span className="internal-label">Solo para nuestro equipo</span>
          </div>
        </header>
        <main id="main" className="main-content">
          <div className="library-heading">
            <div><h1>Biblioteca de Prompts</h1><p>Encuentra, reutiliza y comparte lo que funciona.</p></div>
            <Link className="button button-primary" href={creationHref} scroll={false}><Icon name="plus" /> Crear Prompt</Link>
          </div>
          <div className="library-tools">
            <form action="/" method="get" className="search-form" role="search" onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              navigate(libraryUrl({ q: String(form.get("q") ?? "").trim(), categoryIds: selectedIds, page: 1 }));
            }}>
              <label htmlFor="prompt-search" className="sr-only">Buscar Prompts</label>
              <Icon name="search" />
              <input id="prompt-search" name="q" type="search" maxLength={200} value={draft}
                onChange={(event) => setSearchState({ draft: event.target.value, appliedQ: q })} placeholder="Buscar en título, descripción y contenido" />
              <button type="submit" className="button search-button" disabled={pending}>Buscar</button>
            </form>
            <details className="mobile-category-filter">
              <summary>{selectedIds.length ? `Categorías (${selectedIds.length})` : "Categorías"}</summary>
              <div className="mobile-category-options">
                {categories.map((category) => categoryCheckbox(category, "mobile-category-option"))}
              </div>
            </details>
          </div>
          <section className="prompt-section" aria-labelledby="prompt-list-title" aria-busy={pending}>
            <div className="section-heading">
              <div className="section-title">
                <h2 id="prompt-list-title">{q ? "Resultados de búsqueda" : categoryHeading(categoryIds, categories)}</h2>
                <span className="result-count">{total}</span>
              </div>
            </div>
            <p className="filter-status" role="status">{pending ? "Actualizando Prompts…" : `${total} ${total === 1 ? "Prompt disponible" : "Prompts disponibles"}`}</p>
            {filtered && <div className="active-filters">
              <p>{q && <>Búsqueda: <strong>“{q}”</strong></>}</p>
              {selectedCategories.length > 0 && <ul className="filter-chips" aria-label="Categorías seleccionadas">
                {selectedCategories.map((category) => (
                  <li key={category.id}>
                    <button type="button" className="filter-chip" aria-label={`Quitar filtro ${category.name}`} onClick={() => toggle(category.id)}>
                      <span className="category-dot" style={{ backgroundColor: category.color }} />{category.name}<span aria-hidden="true"> ✕</span>
                    </button>
                  </li>
                ))}
              </ul>}
              {filterLink("/", "Limpiar filtros", "text-link")}
            </div>}
            {items.length > 0 ? (
              <div className="prompt-list">
                <div className="list-columns" aria-hidden="true"><span>Prompt</span><span>Categorías</span><span>Autor</span><span>Compartido</span></div>
                {items.map((prompt) => (
                  <article key={prompt.id} className="prompt-row">
                    <div className="prompt-summary">
                      <h3><Link scroll={false} href={`/prompts/${prompt.id}?from=${encodeURIComponent(origin)}`}>{prompt.title}</Link></h3>
                      {prompt.description && <p className="prompt-description">{prompt.description}</p>}
                    </div>
                    <CategoryBadges categories={prompt.categories} limit={VISIBLE_BADGES} />
                    <span className="author-name">{prompt.authorName}</span>
                    <time dateTime={prompt.createdAt}>{new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(prompt.createdAt))}</time>
                  </article>
                ))}
              </div>
            ) : <div className="empty-state">
              <Icon name={filtered ? "search" : "library"} />
              <h3>{filtered ? "No encontramos Prompts con estos filtros" : total > 0 ? "Esta página no tiene Prompts" : "El primer Prompt puede ser el tuyo"}</h3>
              <p>{filtered ? "Prueba con otras palabras o cambia de Categoría." : "Comparte un Prompt para que otros Usuarios puedan reutilizarlo."}</p>
              {filtered || total > 0 ? filterLink("/", "Limpiar filtros", "button button-secondary") : <Link className="button button-primary" href={creationHref} scroll={false}>Crear el primer Prompt</Link>}
            </div>}
            {(pageCount > 1 || page > 1) && <nav className="pagination" aria-label="Paginación">
              <span>{total ? `${Math.min((page - 1) * pageSize + 1, total + 1) > total ? 0 : (page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} de ${total} Prompts` : "0 Prompts"}</span>
              <div>
                {page > 1 ? filterLink(libraryUrl({ q, categoryIds, page: page - 1 }), <><Icon name="back" /> Anterior</>, "button button-secondary") : <span className="button button-secondary" aria-disabled="true">Anterior</span>}
                <span className="page-number" aria-current="page">{page}</span>
                {page < pageCount ? filterLink(libraryUrl({ q, categoryIds, page: page + 1 }), <>Siguiente <Icon name="arrow" /></>, "button button-secondary") : <span className="button button-secondary" aria-disabled="true">Siguiente</span>}
              </div>
            </nav>}
          </section>
          <footer className="workspace-footer"><span>Promptify · Biblioteca interna</span><span>No compartas secretos ni datos personales.</span></footer>
        </main>
      </div>
    </div>
  );
}
