'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Recipe } from '@/types/database'
import RecipeCard from './RecipeCard'
import SearchBar from './SearchBar'
import SortMenu from './SortMenu'

type SortOption = 'newest' | 'oldest' | 'title-asc' | 'title-desc'

interface RecipeWithSignedUrl extends Recipe {
  signedImageUrl?: string
}

interface RecipeListProps {
  initialRecipes: RecipeWithSignedUrl[]
  totalCount: number
  pageSize: number
  currentPage: number
  searchQuery: string
  sortOption: SortOption
}

export default function RecipeList({
  initialRecipes,
  totalCount,
  pageSize,
  currentPage,
  searchQuery,
  sortOption,
}: RecipeListProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchInput, setSearchInput] = useState(searchQuery)

  const totalPages = Math.ceil(totalCount / pageSize)

  const updateUrl = useCallback(
    (updates: { q?: string; sort?: string; page?: number }) => {
      const next = new URLSearchParams(searchParams.toString())

      if (updates.q !== undefined) {
        if (updates.q) next.set('q', updates.q)
        else next.delete('q')
        next.delete('page')
      }

      if (updates.sort !== undefined) {
        if (updates.sort && updates.sort !== 'newest') next.set('sort', updates.sort)
        else next.delete('sort')
        next.delete('page')
      }

      if (updates.page !== undefined) {
        if (updates.page > 1) next.set('page', String(updates.page))
        else next.delete('page')
      }

      router.push(`?${next.toString()}`)
    },
    [router, searchParams],
  )

  // Debounce search input → URL update
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== searchQuery) {
        updateUrl({ q: searchInput })
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput]) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync input when URL changes (e.g. browser back/forward)
  useEffect(() => {
    setSearchInput(searchQuery)
  }, [searchQuery])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
          Mijn Recepten
        </h1>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <SearchBar value={searchInput} onChange={setSearchInput} />
          </div>
          <SortMenu value={sortOption} onChange={(sort) => updateUrl({ sort })} />
        </div>
      </div>

      {initialRecipes.length === 0 ? (
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
          {initialRecipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            onClick={() => updateUrl({ page: currentPage - 1 })}
            disabled={currentPage <= 1}
            className="btn btn-secondary disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ← Vorige
          </button>
          <span className="text-sm text-gray-600">
            Pagina {currentPage} van {totalPages}
          </span>
          <button
            onClick={() => updateUrl({ page: currentPage + 1 })}
            disabled={currentPage >= totalPages}
            className="btn btn-secondary disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Volgende →
          </button>
        </div>
      )}

      <div className="mt-6 text-center text-sm text-gray-500">
        {totalCount} recept{totalCount !== 1 ? 'en' : ''}
        {searchQuery ? ' gevonden' : ' totaal'}
      </div>
    </div>
  )
}
