import { notFound } from 'next/navigation'
import { getPublicRecipeBySlug } from '@/lib/recipes'
import PublicRecipeDetail from '@/components/PublicRecipeDetail'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function PublicRecipePage({ params }: PageProps) {
  const { slug } = await params
  const recipe = getPublicRecipeBySlug(slug)
  if (!recipe) notFound()

  return <PublicRecipeDetail recipe={recipe} />
}
