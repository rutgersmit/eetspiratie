'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Mode = 'login' | 'register' | 'forgot'

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        router.push('/recipes')
        router.refresh()
      } else if (mode === 'register') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        })
        if (error) throw error
        setMessage('Account aangemaakt! Controleer je e-mail voor verificatie.')
        setMode('login')
      } else if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
        })
        if (error) throw error
        setMessage('Check je e-mail voor de wachtwoord reset link.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is iets misgegaan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary-600 mb-2">Eetspiratie</h1>
          <p className="text-gray-600">Jouw recepten, altijd bij de hand</p>
        </div>

        <div className="card p-8">
          <h2 className="text-2xl font-semibold mb-6 text-center">
            {mode === 'login' && 'Inloggen'}
            {mode === 'register' && 'Registreren'}
            {mode === 'forgot' && 'Wachtwoord vergeten'}
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {message && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="label">
                E-mailadres
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="je@email.nl"
                required
              />
            </div>

            {mode !== 'forgot' && (
              <div>
                <label htmlFor="password" className="label">
                  Wachtwoord
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3"
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
                  Bezig...
                </span>
              ) : (
                <>
                  {mode === 'login' && 'Inloggen'}
                  {mode === 'register' && 'Account aanmaken'}
                  {mode === 'forgot' && 'Reset link versturen'}
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm space-y-2">
            {mode === 'login' && (
              <>
                <button
                  onClick={() => setMode('forgot')}
                  className="text-primary-600 hover:underline block w-full"
                >
                  Wachtwoord vergeten?
                </button>
                <p className="text-gray-600">
                  Nog geen account?{' '}
                  <button
                    onClick={() => setMode('register')}
                    className="text-primary-600 hover:underline font-medium"
                  >
                    Registreer
                  </button>
                </p>
              </>
            )}
            {mode === 'register' && (
              <p className="text-gray-600">
                Al een account?{' '}
                <button
                  onClick={() => setMode('login')}
                  className="text-primary-600 hover:underline font-medium"
                >
                  Inloggen
                </button>
              </p>
            )}
            {mode === 'forgot' && (
              <button
                onClick={() => setMode('login')}
                className="text-primary-600 hover:underline"
              >
                Terug naar inloggen
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
