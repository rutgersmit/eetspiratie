'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Recipe } from '@/types/database'

interface RecipeWithSignedUrl extends Recipe {
  signedImageUrl?: string
}

interface RecipeCardProps {
  recipe: RecipeWithSignedUrl
}

export default function RecipeCard({ recipe }: RecipeCardProps) {
  const formattedDate = new Date(recipe.created_at).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return (
    <Link href={`/recipes/${recipe.slug}`} className="block group">
      <div className="card h-full transition-shadow hover:shadow-md">
        <div className="aspect-[4/3] relative bg-gray-100">
          {recipe.signedImageUrl ? (
            <Image
              src={recipe.signedImageUrl}
              alt={recipe.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <svg
                className="w-16 h-16 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-lg text-gray-900 mb-1 line-clamp-1 group-hover:text-primary-600 transition-colors">
            {recipe.title}
          </h3>
          {recipe.description && (
            <p className="text-gray-600 text-sm line-clamp-2 mb-2">
              {recipe.description}
            </p>
          )}
          <p className="text-xs text-gray-400">{formattedDate}</p>
        </div>
      </div>
    </Link>
  )
}
