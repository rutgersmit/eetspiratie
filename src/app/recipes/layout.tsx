import { requireAuth } from '@/lib/auth'
import Header from '@/components/Header'

export default async function RecipesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { username } = await requireAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      <Header username={username} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  )
}
