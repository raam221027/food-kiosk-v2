import CIcon from '@coreui/icons-react'
import {
  cilCart,
  cilChartLine,
  cilFastfood,
  cilLayers,
  cilList,
  cilPlus,
  cilSpeedometer,
} from '@coreui/icons'
import { CNavItem, CNavTitle } from '@coreui/react'

import { ROLES } from '@/auth/roles'
import type { NavItem } from './types'

const MENU_ROLES = [ROLES.ADMIN, ROLES.MANAGER]

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
    component: CNavTitle,
    name: 'Menu',
    roles: MENU_ROLES,
  },
  {
    component: CNavItem,
    name: 'Products',
    to: '/menu/products',
    icon: <CIcon icon={cilFastfood} customClassName="nav-icon" />,
    roles: MENU_ROLES,
  },
  {
    component: CNavItem,
    name: 'Categories',
    to: '/menu/categories',
    icon: <CIcon icon={cilLayers} customClassName="nav-icon" />,
    roles: MENU_ROLES,
  },
  {
    component: CNavItem,
    name: 'Add-ons',
    to: '/menu/add-ons',
    icon: <CIcon icon={cilPlus} customClassName="nav-icon" />,
    roles: MENU_ROLES,
  },
  {
    component: CNavItem,
    name: 'Reports',
    to: '/reports',
    icon: <CIcon icon={cilChartLine} customClassName="nav-icon" />,
    roles: MENU_ROLES,
  },
  {
    component: CNavTitle,
    name: 'Operations',
  },
  {
    component: CNavItem,
    name: 'Kitchen',
    to: '/kitchen',
    icon: <CIcon icon={cilList} customClassName="nav-icon" />,
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
