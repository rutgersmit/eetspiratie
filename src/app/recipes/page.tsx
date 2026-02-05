import { createClient } from '@/lib/supabase/server'
import RecipeList from '@/components/RecipeList'
import { Recipe } from '@/types/database'

export const dynamic = 'force-dynamic'

export default async function RecipesPage() {
  const supabase = await createClient()

  const { data: recipes, error } = await supabase
    .from('recipes')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching recipes:', error)
  }

  return <RecipeList initialRecipes={recipes as Recipe[] || []} />
}
