import { lazy } from 'react'

import { ROLES } from '@/auth/roles'
import type { AdminRoute } from './types'

const Dashboard = lazy(() => import('./views/dashboard/Dashboard'))
const ManagerDashboard = lazy(() => import('./views/dashboard/ManagerDashboard'))
const KitchenDashboard = lazy(() => import('./views/kitchen/KitchenDashboard'))
const CashierDashboard = lazy(() => import('./views/cashier/CashierDashboard'))
const Products = lazy(() => import('./views/menu/Products'))
const Categories = lazy(() => import('./views/menu/Categories'))
const AddOns = lazy(() => import('./views/menu/AddOns'))
const Reports = lazy(() => import('./views/reports/Reports'))

/** Menu management and reports: managers, plus admins who can do everything. */
const MENU_ROLES = [ROLES.ADMIN, ROLES.MANAGER]

/**
 * Admin route table.
 *
 * Paths are written absolute ('/dashboard') but the shell is mounted at
 * /admin — AppContent strips the leading slash so they resolve relative to the
 * parent route, and AppBreadcrumb adds the prefix back when building links.
 *
 * `roles` mirrors the matching entry in _nav.tsx. AppContent drops routes the
 * signed-in user is not allowed to open, so hiding a link also blocks the URL.
 */
export const routes: AdminRoute[] = [
  { path: '/', exact: true, name: 'Home' },
  { path: '/dashboard', name: 'Dashboard', element: Dashboard, roles: [ROLES.ADMIN] },
  { path: '/manager', name: 'Dashboard', element: ManagerDashboard, roles: [ROLES.MANAGER] },
  { path: '/menu/products', name: 'Products', element: Products, roles: MENU_ROLES },
  { path: '/menu/categories', name: 'Categories', element: Categories, roles: MENU_ROLES },
  { path: '/menu/add-ons', name: 'Add-ons', element: AddOns, roles: MENU_ROLES },
  { path: '/reports', name: 'Reports', element: Reports, roles: MENU_ROLES },
  {
    path: '/kitchen',
    name: 'Kitchen',
    element: KitchenDashboard,
    roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.KITCHEN],
  },
  {
    path: '/cashier',
    name: 'Cashier',
    element: CashierDashboard,
    roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.CASHIER],
  },
]

export default routes
