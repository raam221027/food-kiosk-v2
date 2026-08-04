import { create } from 'zustand'

import { getUser, login as loginRequest, logout as logoutRequest } from '@/services/authService'
import type { AuthUser, LoginCredentials } from '@/services/authService'
import { normalizeRole, type Role } from './roles'

type AuthStatus = 'loading' | 'authenticated' | 'guest'

interface AuthState {
  user: AuthUser | null
  /** 'loading' until the initial session check resolves, so guards can wait. */
  status: AuthStatus
  /** The signed-in user's role, normalized; null when signed out. */
  role: Role | null
  bootstrap: () => Promise<void>
  signIn: (credentials: LoginCredentials) => Promise<AuthUser>
  signOut: () => Promise<void>
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  status: 'loading',
  role: null,

  /**
   * Restores an existing session on app start. A 401 here is the normal
   * signed-out case, not an error worth surfacing.
   */
  bootstrap: async () => {
    try {
      const user = await getUser()
      set({ user, role: normalizeRole(user.role), status: 'authenticated' })
    } catch {
      set({ user: null, role: null, status: 'guest' })
    }
  },

  signIn: async (credentials) => {
    const user = await loginRequest(credentials)
    set({ user, role: normalizeRole(user.role), status: 'authenticated' })
    return user
  },

  signOut: async () => {
    try {
      await logoutRequest()
    } finally {
      // Clear locally even if the request failed — the session may already be
      // gone server-side, and leaving stale state signed in is worse.
      set({ user: null, role: null, status: 'guest' })
    }
  },
}))
