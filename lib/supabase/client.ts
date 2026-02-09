import { createBrowserClient } from '@supabase/ssr'

// Direct access required — Next.js replaces NEXT_PUBLIC_* only with static references
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY as string

export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseKey)
}
