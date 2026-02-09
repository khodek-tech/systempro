import { createBrowserClient } from '@supabase/ssr'

function getEnvVar(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name} environment variable`)
  return value
}

const supabaseUrl = getEnvVar('NEXT_PUBLIC_SUPABASE_URL')
const supabaseKey = getEnvVar('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY')

export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseKey)
}
