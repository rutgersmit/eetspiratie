import RecipeForm from '@/components/RecipeForm'

export default function NewRecipePage() {
  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
        Nieuw recept
      </h1>
      <RecipeForm />
    </div>
  )
}
