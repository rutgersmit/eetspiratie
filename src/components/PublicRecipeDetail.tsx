'use client'

import Image from 'next/image'
import { Recipe } from '@/types/database'

interface PublicRecipeDetailProps {
  recipe: Recipe
  signedImageUrl: string | null
}

export default function PublicRecipeDetail({ recipe, signedImageUrl }: PublicRecipeDetailProps) {
  const ingredientLines = recipe.ingredients
    .split('\n')
    .filter((line) => line.trim())

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="card overflow-hidden">
          {signedImageUrl && (
            <div className="relative aspect-video sm:aspect-[21/9]">
              <Image
                src={signedImageUrl}
                alt={recipe.title}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 768px"
              />
            </div>
          )}

          <div className="p-6 sm:p-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
              {recipe.title}
            </h1>

            {recipe.description && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  Omschrijving
                </h2>
                <p className="text-gray-600 whitespace-pre-wrap">
                  {recipe.description}
                </p>
              </div>
            )}

            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                Ingrediënten
              </h2>
              <ul className="space-y-2">
                {ingredientLines.map((ingredient, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="w-2 h-2 mt-2 rounded-full bg-primary-500 flex-shrink-0" />
                    <span className="text-gray-700">{ingredient}</span>
                  </li>
                ))}
              </ul>
            </div>

            {recipe.source_url && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <a
                  href={recipe.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700"
                >
                  <svg
                    className="w-4 h-4 mr-1.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                  Bekijk origineel recept
                </a>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-sm text-gray-400 mt-6">
          Gedeeld via Eetspiratie
        </p>
      </div>
    </div>
  )
}
