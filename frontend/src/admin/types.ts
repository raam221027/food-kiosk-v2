import type { ComponentType, LazyExoticComponent, ReactNode } from 'react'

import type { Role } from '@/auth/roles'

/** Badge rendered on the right-hand side of a sidebar entry. */
export interface NavBadge {
  color: string
  text: string
}

/**
 * One entry in the sidebar navigation tree defined in `_nav.tsx`.
 *
 * `component` is the CoreUI component that renders it — CNavItem, CNavGroup or
 * CNavTitle. Extra props are passed straight through to it, hence the index
 * signature.
 */
export interface NavItem {
  component: ComponentType<Record<string, unknown>>
  name?: ReactNode
  to?: string
  href?: string
  icon?: ReactNode
  badge?: NavBadge
  items?: NavItem[]
  /** Roles allowed to see this entry. Omit to show it to every role. */
  roles?: Role[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

/** One entry in the admin route table defined in `routes.ts`. */
export interface AdminRoute {
  path: string
  name: string
  element?: LazyExoticComponent<ComponentType>
  exact?: boolean
  /** Roles allowed to open this route. Omit to allow every role. */
  roles?: Role[]
}
