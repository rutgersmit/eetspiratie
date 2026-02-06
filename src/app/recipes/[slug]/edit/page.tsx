import { requireAuth } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import RecipeForm from "@/components/RecipeForm";
import { Recipe } from "@/types/database";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function EditRecipePage({ params }: PageProps) {
  const { slug } = await params;
  const { supabase, user } = await requireAuth();

  const { data, error } = await supabase
    .from("recipes")
    .select("*")
    .eq("slug", slug)
    .eq("user_id", user.id)
    .single();

  if (error || !data) {
    notFound();
  }

  const recipe = data as Recipe;

  let signedImageUrl: string | null = null;
  if (recipe.image_path) {
    const { data: signedData } = await supabase.storage
      .from("recipe-images")
      .createSignedUrl(recipe.image_path, 3600);
    signedImageUrl = signedData?.signedUrl || null;
  }

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
        Recept bewerken
      </h1>
      <RecipeForm
        recipe={recipe}
        existingImageUrl={signedImageUrl || undefined}
      />
    </div>
  );
}
