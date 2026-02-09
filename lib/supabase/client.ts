import { createBrowserClient } from '@supabase/ssr'

// Direct access required — Next.js replaces NEXT_PUBLIC_* only with static references
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Chybí proměnné prostředí NEXT_PUBLIC_SUPABASE_URL nebo NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY. Zkontrolujte soubor .env.local.'
  )
}

export function createClient() {
  return createBrowserClient(supabaseUrl as string, supabaseKey as string)
}
