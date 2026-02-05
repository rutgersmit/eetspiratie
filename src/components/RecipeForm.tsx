'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Recipe } from '@/types/database'
import { generateSlug } from '@/lib/utils'
import ImageUploader from './ImageUploader'

interface RecipeFormProps {
  recipe?: Recipe
  existingImageUrl?: string
}

export default function RecipeForm({ recipe, existingImageUrl }: RecipeFormProps) {
  const [title, setTitle] = useState(recipe?.title || '')
  const [description, setDescription] = useState(recipe?.description || '')
  const [ingredients, setIngredients] = useState(recipe?.ingredients || '')
  const [sourceUrl, setSourceUrl] = useState(recipe?.source_url || '')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(existingImageUrl || null)
  const [removeImage, setRemoveImage] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const isEditing = !!recipe

  const handleImageChange = (file: File | null) => {
    setImageFile(file)
    setRemoveImage(false)
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setImagePreview(existingImageUrl || null)
    }
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview(null)
    setRemoveImage(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!title.trim()) {
      setError('Titel is verplicht')
      return
    }

    if (!ingredients.trim()) {
      setError('Ingrediënten zijn verplicht')
      return
    }

    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Niet ingelogd')

      let imagePath = recipe?.image_path || null

      // Handle image upload
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop()
        const fileName = `${user.id}/${Date.now()}.${fileExt}`

        // Delete old image if exists
        if (recipe?.image_path) {
          await supabase.storage.from('recipe-images').remove([recipe.image_path])
        }

        const { error: uploadError } = await supabase.storage
          .from('recipe-images')
          .upload(fileName, imageFile)

        if (uploadError) throw uploadError
        imagePath = fileName
      } else if (removeImage && recipe?.image_path) {
        // Remove existing image
        await supabase.storage.from('recipe-images').remove([recipe.image_path])
        imagePath = null
      }

      // Generate unique slug
      const baseSlug = generateSlug(title.trim())
      let slug = baseSlug
      let slugSuffix = 0

      // Check for existing slugs and make unique
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: existingSlugs } = await (supabase as any)
        .from('recipes')
        .select('slug')
        .like('slug', `${baseSlug}%`)
        .neq('id', recipe?.id || '')

      if (existingSlugs && existingSlugs.length > 0) {
        const slugSet = new Set(existingSlugs.map((r: { slug: string }) => r.slug))
        while (slugSet.has(slug)) {
          slugSuffix++
          slug = `${baseSlug}-${slugSuffix}`
        }
      }

      if (isEditing && recipe) {
        const updateData = {
          title: title.trim(),
          slug: recipe.title !== title.trim() ? slug : recipe.slug,
          description: description.trim() || null,
          ingredients: ingredients.trim(),
          image_path: imagePath,
          source_url: sourceUrl.trim() || null,
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: updateError } = await (supabase as any)
          .from('recipes')
          .update(updateData)
          .eq('id', recipe.id)

        if (updateError) throw updateError
        router.push(`/recipes/${updateData.slug}`)
      } else {
        const insertData = {
          user_id: user.id,
          title: title.trim(),
          slug,
          description: description.trim() || null,
          ingredients: ingredients.trim(),
          image_path: imagePath,
          source_url: sourceUrl.trim() || null,
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error: insertError } = await (supabase as any)
          .from('recipes')
          .insert(insertData)
          .select()
          .single()

        if (insertError) throw insertError
        if (data) {
          router.push(`/recipes/${data.slug}`)
        }
      }

      router.refresh()
    } catch (err) {
      console.error('Error saving recipe:', err)
      setError(err instanceof Error ? err.message : 'Er is iets misgegaan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl">
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="card p-6 space-y-6">
        <div>
          <label htmlFor="title" className="label">
            Titel <span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input"
            placeholder="Bijv. Pasta Carbonara"
            required
          />
        </div>

        <div>
          <label className="label">Afbeelding</label>
          <ImageUploader
            preview={imagePreview}
            onChange={handleImageChange}
            onRemove={handleRemoveImage}
          />
        </div>

        <div>
          <label htmlFor="description" className="label">
            Omschrijving
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input min-h-[100px] resize-y"
            placeholder="Korte beschrijving van het recept, bereidingswijze, tips..."
            rows={4}
          />
        </div>

        <div>
          <label htmlFor="ingredients" className="label">
            Ingrediënten <span className="text-red-500">*</span>
          </label>
          <textarea
            id="ingredients"
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            className="input min-h-[150px] resize-y font-mono text-sm"
            placeholder={`200g pasta\n100g spek\n2 eieren\n50g Parmezaanse kaas\nZout en peper naar smaak`}
            rows={8}
            required
          />
          <p className="mt-1 text-sm text-gray-500">
            Eén ingrediënt per regel
          </p>
        </div>

        <div>
          <label htmlFor="sourceUrl" className="label">
            Bron
          </label>
          <input
            id="sourceUrl"
            type="url"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            className="input"
            placeholder="https://example.com/recept"
          />
          <p className="mt-1 text-sm text-gray-500">
            Link naar het originele recept
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <button
          type="submit"
          disabled={loading}
          className="btn-primary py-3 px-6 order-1 sm:order-2"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Opslaan...
            </span>
          ) : isEditing ? (
            'Opslaan'
          ) : (
            'Recept toevoegen'
          )}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="btn-secondary py-3 px-6 order-2 sm:order-1"
        >
          Annuleren
        </button>
      </div>
    </form>
  )
}
