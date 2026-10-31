export interface Recipe {
  id: string
  title: string
  slug: string
  description: string | null
  ingredients: string
  /** File name inside DATA_DIR/images, e.g. "3f2a….jpg" */
  image_path: string | null
  source_url: string | null
  is_public: boolean
  created_at: string
  updated_at: string
}

export type SortOption = 'newest' | 'oldest' | 'title-asc' | 'title-desc'
