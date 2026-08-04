import { lazy } from 'react'

import { ROLES } from '@/auth/roles'
import type { AdminRoute } from './types'

const Dashboard = lazy(() => import('./views/dashboard/Dashboard'))
const ManagerDashboard = lazy(() => import('./views/dashboard/ManagerDashboard'))
const KitchenDashboard = lazy(() => import('./views/kitchen/KitchenDashboard'))
const CashierDashboard = lazy(() => import('./views/cashier/CashierDashboard'))

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
