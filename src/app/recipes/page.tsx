import { requireAuth } from "@/lib/auth";
import { listRecipes } from "@/lib/recipes";
import RecipeList from "@/components/RecipeList";
import type { SortOption } from "@/types/database";

const PAGE_SIZE = 24;
const SORT_OPTIONS: SortOption[] = ["newest", "oldest", "title-asc", "title-desc"];

export default async function RecipesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireAuth();

  const params = await searchParams;
  const page = Math.max(1, parseInt((params.page as string) || "1", 10) || 1);
  const searchQuery = typeof params.q === "string" ? params.q : "";
  const sortOption = SORT_OPTIONS.includes(params.sort as SortOption)
    ? (params.sort as SortOption)
    : "newest";

  const { recipes, count } = listRecipes({
    search: searchQuery,
    sort: sortOption,
    page,
    pageSize: PAGE_SIZE,
  });

  return (
    <RecipeList
      recipes={recipes}
      totalCount={count}
      pageSize={PAGE_SIZE}
      currentPage={page}
      searchQuery={searchQuery}
      sortOption={sortOption}
    />
  );
}
