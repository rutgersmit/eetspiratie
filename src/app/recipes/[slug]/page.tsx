import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { getRecipeBySlug } from "@/lib/recipes";
import RecipeDetail from "@/components/RecipeDetail";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function RecipeDetailPage({ params }: PageProps) {
  await requireAuth();
  const { slug } = await params;
  const recipe = getRecipeBySlug(slug);
  if (!recipe) notFound();

  return <RecipeDetail recipe={recipe} />;
}
