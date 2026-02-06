import { requireAuth } from "@/lib/supabase/server";
import RecipeList from "@/components/RecipeList";
import { Recipe } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function RecipesPage() {
  const { supabase, user } = await requireAuth();

  const { data: recipes, error } = await supabase
    .from("recipes")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching recipes:", error);
  }

  const recipesWithUrls = await Promise.all(
    ((recipes as Recipe[]) || []).map(async (recipe) => {
      if (recipe.image_path) {
        const { data } = await supabase.storage
          .from("recipe-images")
          .createSignedUrl(recipe.image_path, 3600);
        return { ...recipe, signedImageUrl: data?.signedUrl ?? undefined };
      }
      return recipe;
    }),
  );

  return <RecipeList initialRecipes={recipesWithUrls} />;
}
