/**
 * AppContent Component
 *
 * Main content area that renders routes defined in routes.js.
 * Handles lazy loading with Suspense and provides a loading spinner
 * while components are being loaded.
 *
 * Features:
 * - Dynamic route rendering from routes configuration
 * - Suspense boundary for lazy-loaded components
 * - Automatic redirect from root to dashboard
 * - Loading spinner fallback during component load
 *
 * @component
 * @example
 * return (
 *   <AppContent />
 * )
 */

import React, { Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import { CAlert, CContainer, CSpinner } from '@coreui/react'

import { ADMIN_BASE } from '../store'
import { homeFor } from '@/auth/roles'
import { useAuth } from '@/auth/useAuth'

// routes config
import { routes } from '../routes'

/**
 * AppContent functional component
 *
 * Renders all application routes within a container with:
 * - Suspense for lazy-loaded route components
 * - Spinner shown during component loading
 * - Default redirect to dashboard
 *
 * Memoized to prevent unnecessary re-renders when parent updates.
 *
 * @returns {React.ReactElement} Content container with routed views
 */
const AppContent = () => {
  const role = useAuth((state) => state.role)

  // An authenticated user whose role the app does not recognise has nowhere to
  // redirect to — bail out here rather than bouncing them around the shell.
  if (role === null) {
    return (
      <CContainer className="px-4" lg>
        <CAlert color="warning" className="mt-4">
          Your account has no dashboard assigned. Ask an administrator to give you a role.
        </CAlert>
      </CContainer>
    )
  }

  // Routes the signed-in role may not open are never registered, so typing the
  // URL falls through to the redirect below instead of rendering the view.
  const allowedRoutes = routes.filter(
    (route) => !route.roles || (role !== null && route.roles.includes(role)),
  )

  // Paths are relative inside this <Routes>, but homeFor returns an absolute
  // '/admin/...' path, so strip the shell prefix.
  const fallbackPath = homeFor(role).replace(`${ADMIN_BASE}/`, '')

  return (
    <CContainer className="px-4" lg>
      <Suspense fallback={<CSpinner color="primary" />}>
        <Routes>
          {allowedRoutes.map((route, idx) => {
            // Paths in routes.ts are absolute ('/dashboard'). This <Routes> is a
            // descendant of the /admin/* route, so they have to be relative here.
            return (
              route.element && (
                <Route key={idx} path={route.path.replace(/^\//, '')} element={<route.element />} />
              )
            )
          })}
          <Route path="*" element={<Navigate to={fallbackPath} replace />} />
        </Routes>
      </Suspense>
    </CContainer>
  )
}

export default React.memo(AppContent)
