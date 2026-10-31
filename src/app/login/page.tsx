'use client'

import { useState } from 'react'
import { login } from '@/lib/actions'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showForgot, setShowForgot] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Redirects to /recipes on success
      const result = await login(username, password)
      if (result?.error) {
        setError(result.error)
        setLoading(false)
      }
    } catch {
      setError('Er is iets misgegaan')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary-600 mb-2 tracking-tight" style={{ fontFamily: 'var(--font-quicksand)' }}>Eetspiratie</h1>
          <p className="text-gray-600">Jouw recepten, altijd bij de hand</p>
        </div>

        <div className="card p-8">
          <h2 className="text-2xl font-semibold mb-6 text-center">Inloggen</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="label">
                Gebruikersnaam
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                autoCapitalize="none"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="label">
                Wachtwoord
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3"
            >
              {loading ? 'Bezig...' : 'Inloggen'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            {showForgot ? (
              <p className="text-gray-600">
                De login staat in de configuratie van de server
                (<code>AUTH_USERNAME</code> / <code>AUTH_PASSWORD</code>).
                Zie de documentatie.
              </p>
            ) : (
              <button
                type="button"
                onClick={() => setShowForgot(true)}
                className="text-primary-600 hover:underline"
              >
                Wachtwoord vergeten?
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
