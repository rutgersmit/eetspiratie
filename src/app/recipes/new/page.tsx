import { requireAuth } from "@/lib/supabase/server";
import RecipeForm from "@/components/RecipeForm";

export default async function NewRecipePage() {
  // Also enforced by recipes/layout.tsx, but explicit for safety
  await requireAuth();

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
        Nieuw recept
      </h1>
      <RecipeForm />
    </div>
  );
}
