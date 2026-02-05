import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="text-center py-12">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Recept niet gevonden
      </h2>
      <p className="text-gray-600 mb-6">
        Dit recept bestaat niet of is verwijderd.
      </p>
      <Link href="/recipes" className="btn-primary">
        Terug naar recepten
      </Link>
    </div>
  )
}
