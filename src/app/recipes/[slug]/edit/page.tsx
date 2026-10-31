import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { getRecipeBySlug } from "@/lib/recipes";
import RecipeForm from "@/components/RecipeForm";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function EditRecipePage({ params }: PageProps) {
  await requireAuth();
  const { slug } = await params;
  const recipe = getRecipeBySlug(slug);
  if (!recipe) notFound();

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
        Recept bewerken
      </h1>
      <RecipeForm recipe={recipe} />
    </div>
  );
}
