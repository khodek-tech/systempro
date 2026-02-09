import { createClient } from './server'

const ADMIN_ROLE_TYPES = ['administrator', 'majitel']

export async function requireAuth() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return { user: null, error: 'Unauthorized' }
  }

  return { user, error: null }
}

/**
 * Require auth + check that user has one of the allowed role types.
 * Returns employee record alongside auth user for convenience.
 */
export async function requireRole(allowedRoleTypes: string[]) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return { user: null, employee: null, error: 'Unauthorized' }
  }

  // Get employee record
  const { data: employee } = await supabase
    .from('zamestnanci')
    .select('id, id_roli')
    .eq('auth_id', user.id)
    .single()

  if (!employee) {
    return { user, employee: null, error: 'Employee not found' }
  }

  // Get role types for the employee's roles
  const roleIds = employee.id_roli as string[]
  if (!roleIds || roleIds.length === 0) {
    return { user, employee, error: 'Forbidden' }
  }

  const { data: roles } = await supabase
    .from('role')
    .select('typ')
    .in('id', roleIds)

  const userRoleTypes = (roles || []).map(r => r.typ)
  const hasAllowed = allowedRoleTypes.some(rt => userRoleTypes.includes(rt))

  if (!hasAllowed) {
    return { user, employee, error: 'Forbidden' }
  }

  return { user, employee, error: null }
}

/**
 * Shortcut: require administrator or majitel role.
 */
export async function requireAdmin() {
  return requireRole(ADMIN_ROLE_TYPES)
}
