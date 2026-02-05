'use client'

import { useState, useMemo, useEffect } from 'react'
import { Recipe } from '@/types/database'
import RecipeCard from './RecipeCard'
import SearchBar from './SearchBar'
import SortMenu from './SortMenu'
import { createClient } from '@/lib/supabase/client'

type SortOption = 'newest' | 'oldest' | 'title-asc' | 'title-desc'

interface RecipeListProps {
  initialRecipes: Recipe[]
}

interface RecipeWithSignedUrl extends Recipe {
  signedImageUrl?: string
}

export default function RecipeList({ initialRecipes }: RecipeListProps) {
  const [recipes, setRecipes] = useState<RecipeWithSignedUrl[]>(initialRecipes)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOption, setSortOption] = useState<SortOption>('newest')
  const supabase = createClient()

  useEffect(() => {
    async function loadSignedUrls() {
      const recipesWithUrls = await Promise.all(
        initialRecipes.map(async (recipe) => {
          if (recipe.image_path) {
            const { data } = await supabase.storage
              .from('recipe-images')
              .createSignedUrl(recipe.image_path, 3600)
            return { ...recipe, signedImageUrl: data?.signedUrl }
          }
          return recipe
        })
      )
      setRecipes(recipesWithUrls)
    }
    loadSignedUrls()
  }, [initialRecipes, supabase.storage])

  const filteredAndSortedRecipes = useMemo(() => {
    let result = [...recipes]

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (recipe) =>
          recipe.title.toLowerCase().includes(query) ||
          recipe.ingredients.toLowerCase().includes(query) ||
          (recipe.description && recipe.description.toLowerCase().includes(query))
      )
    }

    result.sort((a, b) => {
      switch (sortOption) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case 'title-asc':
          return a.title.localeCompare(b.title, 'nl')
        case 'title-desc':
          return b.title.localeCompare(a.title, 'nl')
        default:
          return 0
      }
    })

    return result
  }, [recipes, searchQuery, sortOption])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
          Mijn Recepten
        </h1>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
          </div>
          <SortMenu value={sortOption} onChange={setSortOption} />
        </div>
      </div>

      {filteredAndSortedRecipes.length === 0 ? (
        <div className="text-center py-12">
          {searchQuery ? (
            <>
              <svg
                className="mx-auto h-12 w-12 text-gray-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                Geen resultaten
              </h3>
              <p className="text-gray-500">
                Geen recepten gevonden voor &quot;{searchQuery}&quot;
              </p>
            </>
          ) : (
            <>
              <svg
                className="mx-auto h-12 w-12 text-gray-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                Nog geen recepten
              </h3>
              <p className="text-gray-500 mb-4">
                Begin met het toevoegen van je eerste recept!
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredAndSortedRecipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}

      <div className="mt-6 text-center text-sm text-gray-500">
        {filteredAndSortedRecipes.length} van {recipes.length} recept
        {recipes.length !== 1 ? 'en' : ''}
      </div>
    </div>
  )
}
