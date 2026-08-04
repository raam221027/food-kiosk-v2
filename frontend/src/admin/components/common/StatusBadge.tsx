import { CBadge } from '@coreui/react'

import { humanize } from '../../utils/format'

/**
 * CoreUI theme colour for every status string used across the admin views —
 * order, kitchen and payment statuses plus kitchen priority and on/off flags.
 * Keyed lowercase so callers can pass raw API values.
 */
const STATUS_COLORS: Record<string, string> = {
  // order / kitchen
  pending: 'secondary',
  preparing: 'warning',
  ready: 'info',
  completed: 'success',
  cancelled: 'danger',
  // payment
  failed: 'danger',
  refunded: 'dark',
  // priority
  low: 'secondary',
  medium: 'info',
  high: 'danger',
  // flags
  active: 'success',
  inactive: 'secondary',
  available: 'success',
  unavailable: 'secondary',
  expired: 'danger',
  scheduled: 'info',
  depleted: 'danger',
  'low stock': 'warning',
  'in stock': 'success',
}

interface StatusBadgeProps {
  value: string
  /** Overrides the colour looked up from `value`. */
  color?: string
  className?: string
}

const StatusBadge = ({ value, color, className }: StatusBadgeProps) => (
  <CBadge
    color={color ?? STATUS_COLORS[value.toLowerCase()] ?? 'secondary'}
    shape="rounded-pill"
    className={className}
  >
    {humanize(value)}
  </CBadge>
)

export default StatusBadge
