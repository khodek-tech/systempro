import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

function getEnvVar(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name} environment variable`)
  return value
}

const supabaseUrl = getEnvVar('NEXT_PUBLIC_SUPABASE_URL')
const supabaseKey = getEnvVar('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY')

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component - ignorovat
          }
        },
      },
    }
  )
}
