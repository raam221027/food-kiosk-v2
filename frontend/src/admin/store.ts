import { create } from 'zustand'

/**
 * Sidebar UI state for the CoreUI admin shell.
 *
 * Replaces the Redux store the CoreUI template ships with, so the admin area
 * uses the same state library as the rest of the app.
 */
interface AdminUiState {
  sidebarShow: boolean
  sidebarUnfoldable: boolean
  setSidebarShow: (sidebarShow: boolean) => void
  setSidebarUnfoldable: (sidebarUnfoldable: boolean) => void
}

export const useAdminUi = create<AdminUiState>((set) => ({
  sidebarShow: true,
  sidebarUnfoldable: false,
  setSidebarShow: (sidebarShow) => set({ sidebarShow }),
  setSidebarUnfoldable: (sidebarUnfoldable) => set({ sidebarUnfoldable }),
}))

/** Path the admin shell is mounted at, used to prefix nav links and breadcrumbs. */
export const ADMIN_BASE = '/admin'
