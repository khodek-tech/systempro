'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError('Neplatne prihlasovaci udaje')
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <form onSubmit={handleLogin} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 w-full max-w-md">
      <h1 className="text-2xl font-bold text-center text-slate-800 mb-6">
        SYSTEM.PRO
      </h1>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">
            E-mail
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 outline-none focus:border-blue-300"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">
            Heslo
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 outline-none focus:border-blue-300"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition-all"
        >
          {loading ? 'Prihlasovani...' : 'Prihlasit se'}
        </button>
      </div>
    </form>
  )
}
