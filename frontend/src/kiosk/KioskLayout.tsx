import { Outlet } from 'react-router'

import IdleGuard from './components/IdleGuard'

/**
 * Wraps every customer screen: no text selection or double-tap zoom, so
 * stray presses on the touch screen don't highlight words or rescale the page.
 */
export const KioskRoot = () => (
  <div className="touch-manipulation select-none">
    <Outlet />
  </div>
)

/** Screens in the middle of an order, which reset themselves if abandoned. */
export const OrderInProgress = () => (
  <>
    <Outlet />
    <IdleGuard />
  </>
)
