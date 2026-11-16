import Link from "next/link";
import { connection } from "next/server";
import { getContainer } from "@/lib/container";
import { Brand } from "@/app/components/brand";
import { Icon } from "@/app/components/ui-icon";
import { ReadError } from "@/app/components/read-error";
import { CategoryForm, AdministratorForm } from "@/app/components/administration-forms";

export default async function Administration() {
  await connection();
  const { queries } = getContainer();
  const me = await queries.getMe();
  if (!me.ok) return <ReadError error={me.error} />;
  if (!me.data.isAdministrator) return <ReadError error="You are not allowed to do this" />;
  const categories = await queries.listCategories();
  if (!categories.ok) return <ReadError error={categories.error} />;
  const users = await queries.listUsers();
  if (!users.ok) return <ReadError error={users.error} />;
  return <div className="supporting-page">
    <header className="supporting-header"><Brand /><Link href="/" className="text-link"><Icon name="back" /> Biblioteca</Link></header>
    <main className="administration-content">
      <h1>Administración</h1>
      <p className="detail-description">Mantén las Categorías y gestiona el rol de Administrador.</p>
      <section className="management-section" aria-labelledby="categories-title">
        <h2 id="categories-title">Categorías</h2>
        <p className="section-description">Cada Prompt pertenece a entre una y cinco Categorías. Solo puedes eliminar las que no contienen Prompts.</p>
        <div className="category-management-list">
          {categories.data.map((category) => <CategoryForm key={category.id} category={category} />)}
          {!categories.data.length && <p className="section-description">Aún no hay Categorías. Crea la primera para poder publicar Prompts.</p>}
        </div>
        <h3 className="management-subheading">Nueva Categoría</h3>
        <CategoryForm />
      </section>
      <section className="management-section" aria-labelledby="roles-title">
        <h2 id="roles-title">Usuarios y roles</h2>
        <p className="section-description">Aquí aparecen los Usuarios que ya han accedido a Promptify. El último Administrador no puede perder su rol.</p>
        <AdministratorForm users={users.data} />
      </section>
    </main>
  </div>;
}
