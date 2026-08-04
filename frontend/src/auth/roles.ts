/**
 * Role names and where each one lands after signing in.
 *
 * The strings must match `RoleSeeder` on the Laravel side exactly — note that
 * kitchen staff is two words with a space, which is why everything goes through
 * `normalizeRole` instead of comparing raw strings.
 */

export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  CASHIER: 'cashier',
  KITCHEN: 'kitchen staff',
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

export const ALL_ROLES: Role[] = [ROLES.ADMIN, ROLES.MANAGER, ROLES.CASHIER, ROLES.KITCHEN]

/** Landing route per role — admin keeps the existing dashboard view. */
export const HOME_BY_ROLE: Record<Role, string> = {
  [ROLES.ADMIN]: '/admin/dashboard',
  [ROLES.MANAGER]: '/admin/manager',
  [ROLES.KITCHEN]: '/admin/kitchen',
  [ROLES.CASHIER]: '/admin/cashier',
}

/**
 * Coerces whatever the API sent into a known role.
 *
 * Tolerates casing and separator drift ('Kitchen Staff', 'kitchen_staff') so a
 * seeder tweak does not silently lock someone out.
 */
export const normalizeRole = (value?: string | null): Role | null => {
  if (!value) return null
  const cleaned = value.trim().toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ')
  return (ALL_ROLES as string[]).includes(cleaned) ? (cleaned as Role) : null
}

/** Where to send a user once authenticated; falls back to the login screen. */
export const homeFor = (role?: string | null): string => {
  const normalized = normalizeRole(role)
  return normalized ? HOME_BY_ROLE[normalized] : '/login'
}
