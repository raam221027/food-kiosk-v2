import { Navigate, Outlet } from 'react-router'

import { useAuth } from './useAuth'
import { homeFor } from './roles'

/**
 * Wraps the login screen so an already-signed-in user is sent to their
 * dashboard instead of being shown the form again.
 */
const RedirectIfAuthenticated = () => {
  const status = useAuth((state) => state.status)
  const role = useAuth((state) => state.role)

  if (status === 'loading') {
    return null
  }

  if (status === 'authenticated') {
    return <Navigate to={homeFor(role)} replace />
  }

  return <Outlet />
}

export default RedirectIfAuthenticated
