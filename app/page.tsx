import { connection } from "next/server";
import { getContainer } from "@/lib/container";
import { parseCategoryIdsParam } from "@/lib/schemas/prompt";
import { Library } from "./components/library";
import { ReadError } from "./components/read-error";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function Home({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await connection();
  const params = await searchParams;
  const { queries } = getContainer();
  const [me, categories, prompts] = await Promise.all([
    queries.getMe(),
    queries.listCategories(),
    queries.listPrompts({ ...params, pageSize: "12" }),
  ]);
  if (!me.ok) return <ReadError error={me.error} />;
  if (!categories.ok) return <ReadError error={categories.error} />;
  if (!prompts.ok) return <ReadError error={prompts.error} />;

  return <Library
    me={me.data}
    categories={categories.data}
    prompts={prompts.data}
    q={typeof params.q === "string" ? params.q.trim() : ""}
    categoryIds={parseCategoryIdsParam(params.categoryId).filter((id) => categories.data.some((category) => category.id === id))}
  />;
}
