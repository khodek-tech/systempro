import { createClient } from './server'

export async function requireAuth() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return { user: null, error: 'Unauthorized' }
  }

  return { user, error: null }
}
