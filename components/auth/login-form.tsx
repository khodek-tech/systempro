'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'

export function LoginForm() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Resolve username → email via RPC
    const { data: email } = await supabase.rpc('get_email_by_username', {
      p_username: username,
    })

    if (!email) {
      setError('Neplatné přihlašovací údaje')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError('Neplatné přihlašovací údaje')
      setLoading(false)
      return
    }

    const raw = searchParams.get('redirectTo') || '/'
    // Only allow relative paths (prevent open redirect)
    const redirectTo = raw.startsWith('/') && !raw.startsWith('//') ? raw : '/'
    router.push(redirectTo)
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
            Uživatel
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
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
          {loading ? 'Přihlašování...' : 'Přihlásit se'}
        </button>
      </div>
    </form>
  )
}
