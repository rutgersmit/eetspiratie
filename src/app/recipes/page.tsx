import { requireAuth } from "@/lib/supabase/server";
import RecipeList from "@/components/RecipeList";
import { Recipe } from "@/types/database";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 24;

type SortOption = "newest" | "oldest" | "title-asc" | "title-desc";

export default async function RecipesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { supabase, user } = await requireAuth();

  const params = await searchParams;
  const page = Math.max(1, parseInt((params.page as string) || "1", 10));
  const searchQuery = (params.q as string) || "";
  const sortOption: SortOption =
    (params.sort as SortOption) || "newest";

  const offset = (page - 1) * PAGE_SIZE;

  let query = supabase
    .from("recipes")
    .select("*", { count: "exact" })
    .eq("user_id", user.id);

  if (searchQuery.trim()) {
    query = query.or(
      `title.ilike.%${searchQuery}%,ingredients.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`,
    );
  }

  switch (sortOption) {
    case "oldest":
      query = query.order("created_at", { ascending: true });
      break;
    case "title-asc":
      query = query.order("title", { ascending: true });
      break;
    case "title-desc":
      query = query.order("title", { ascending: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  const { data: recipes, error, count } = await query.range(
    offset,
    offset + PAGE_SIZE - 1,
  );

  if (error) {
    console.error("Error fetching recipes:", error);
  }

  const recipeList = (recipes as Recipe[]) || [];

  // Batch signed URL generation — single API call instead of one per recipe
  const imagePaths = recipeList
    .filter((r) => r.image_path)
    .map((r) => r.image_path as string);

  let signedUrlMap: Record<string, string> = {};
  if (imagePaths.length > 0) {
    const { data: signedUrls } = await supabase.storage
      .from("recipe-images")
      .createSignedUrls(imagePaths, 3600);

    if (signedUrls) {
      signedUrlMap = Object.fromEntries(
        signedUrls
          .filter((u: { signedUrl: string | null; path: string }) => u.signedUrl)
          .map((u: { signedUrl: string; path: string }) => [u.path, u.signedUrl]),
      );
    }
  }

  const recipesWithUrls = recipeList.map((recipe) => ({
    ...recipe,
    signedImageUrl: recipe.image_path
      ? signedUrlMap[recipe.image_path]
      : undefined,
  }));

  return (
    <RecipeList
      initialRecipes={recipesWithUrls}
      totalCount={count ?? 0}
      pageSize={PAGE_SIZE}
      currentPage={page}
      searchQuery={searchQuery}
      sortOption={sortOption}
    />
  );
}
