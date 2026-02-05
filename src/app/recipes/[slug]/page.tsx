import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import RecipeDetail from '@/components/RecipeDetail'
import { Recipe } from '@/types/database'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function RecipeDetailPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !data) {
    notFound()
  }

  const recipe = data as Recipe

  let signedImageUrl: string | null = null
  if (recipe.image_path) {
    const { data: signedData } = await supabase.storage
      .from('recipe-images')
      .createSignedUrl(recipe.image_path, 3600)
    signedImageUrl = signedData?.signedUrl || null
  }

  return <RecipeDetail recipe={recipe} signedImageUrl={signedImageUrl} />
}
