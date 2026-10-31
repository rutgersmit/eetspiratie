export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // Remove diacritics
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .substring(0, 100) // Limit length
}

/** Lowercase and strip diacritics, so "Crème" matches "creme". */
export function foldText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

/** Public URL for a stored image file name. */
export function imageUrl(imagePath: string | null): string | null {
  return imagePath ? `/api/images/${imagePath}` : null
}
