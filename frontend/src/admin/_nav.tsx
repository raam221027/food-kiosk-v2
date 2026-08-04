import CIcon from '@coreui/icons-react'
import { cilCart, cilFastfood, cilSpeedometer } from '@coreui/icons'
import { CNavItem } from '@coreui/react'

import { ROLES } from '@/auth/roles'
import type { NavItem } from './types'

/**
 * Sidebar navigation tree.
 *
 * Paths are written without the /admin prefix — AppSidebarNav adds it when it
 * renders each link. Supported `component` values are CNavItem (a link),
 * CNavGroup (a collapsible group, via an `items` array) and CNavTitle (a
 * section heading).
 *
 * `roles` limits an entry to those roles; omitting it shows the entry to
 * everyone. AppSidebarNav filters on it, and routes.ts repeats the same list so
 * a hidden link cannot be reached by typing the URL.
 */
const _nav: NavItem[] = [
  {
    component: CNavItem,
    name: 'Dashboard',
    to: '/dashboard',
    icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
    roles: [ROLES.ADMIN],
  },
  {
    component: CNavItem,
    name: 'Dashboard',
    to: '/manager',
    icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
    roles: [ROLES.MANAGER],
  },
  {
    component: CNavItem,
    name: 'Kitchen',
    to: '/kitchen',
    icon: <CIcon icon={cilFastfood} customClassName="nav-icon" />,
    roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.KITCHEN],
  },
  {
    component: CNavItem,
    name: 'Cashier',
    to: '/cashier',
    icon: <CIcon icon={cilCart} customClassName="nav-icon" />,
    roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.CASHIER],
  },
]

export default _nav
