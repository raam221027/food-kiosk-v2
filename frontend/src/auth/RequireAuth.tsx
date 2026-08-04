import { Navigate, Outlet, useLocation } from 'react-router'

import { useAuth } from './useAuth'
import { homeFor, type Role } from './roles'

interface RequireAuthProps {
  /** Roles allowed through. Omit to allow any authenticated user. */
  roles?: Role[]
}

/**
 * Route guard. Signed-out visitors go to /login (remembering where they were
 * headed); signed-in users without the right role are sent to their own home
 * rather than shown a dead end.
 */
const RequireAuth = ({ roles }: RequireAuthProps) => {
  const status = useAuth((state) => state.status)
  const role = useAuth((state) => state.role)
  const location = useLocation()

  if (status === 'loading') {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <span className="text-muted-foreground text-sm">Checking your session…</span>
      </div>
    )
  }

  if (status === 'guest') {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (roles && (!role || !roles.includes(role))) {
    return <Navigate to={homeFor(role)} replace />
  }

  return <Outlet />
}

export default RequireAuth
