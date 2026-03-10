import { unstable_cache } from "next/cache";
import { requireAuth, createClientWithToken } from "@/lib/supabase/server";
import RecipeList from "@/components/RecipeList";
import { Recipe } from "@/types/database";

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
  const sortOption: SortOption = (params.sort as SortOption) || "newest";

  // Get the access token to authenticate the cached query without cookies
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const accessToken = session!.access_token;

  const fetchRecipes = unstable_cache(
    async (
      userId: string,
      pg: number,
      search: string,
      sort: SortOption,
    ) => {
      const client = createClientWithToken(accessToken);

      let query = client
        .from("recipes")
        .select("*", { count: "exact" })
        .eq("user_id", userId);

      if (search.trim()) {
        query = query.or(
          `title.ilike.%${search}%,ingredients.ilike.%${search}%,description.ilike.%${search}%`,
        );
      }

      switch (sort) {
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

      const { data, error, count } = await query.range(
        (pg - 1) * PAGE_SIZE,
        pg * PAGE_SIZE - 1,
      );

      if (error) console.error("Error fetching recipes:", error);

      return { recipes: (data as Recipe[]) || [], count: count ?? 0 };
    },
    ["user-recipes"],
    { tags: [`recipes-${user.id}`], revalidate: 3600 },
  );

  const { recipes: recipeList, count } = await fetchRecipes(
    user.id,
    page,
    searchQuery,
    sortOption,
  );

  // Signed URL generation runs on every request (one batch call, not cached —
  // URLs expire after 3600s so caching them alongside recipe data is unreliable)
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
      totalCount={count}
      pageSize={PAGE_SIZE}
      currentPage={page}
      searchQuery={searchQuery}
      sortOption={sortOption}
    />
  );
}
