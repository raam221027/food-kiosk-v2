/** Shared formatting helpers for the admin views. */

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

/** Decimal columns arrive from Laravel as strings ("12.50"), so coerce first. */
export const toNumber = (value: number | string | null | undefined): number => {
  const parsed = typeof value === 'string' ? Number.parseFloat(value) : value
  return Number.isFinite(parsed) ? (parsed as number) : 0
}

export const formatCurrency = (value: number | string | null | undefined): string =>
  currencyFormatter.format(toNumber(value))

export const formatNumber = (value: number | string | null | undefined): string =>
  new Intl.NumberFormat('en-US').format(toNumber(value))

export const formatPercent = (value: number | string | null | undefined, digits = 1): string =>
  `${toNumber(value).toFixed(digits)}%`

export const formatDate = (value?: string | null): string =>
  value ? new Date(value).toLocaleDateString('en-US', { dateStyle: 'medium' }) : '—'

export const formatDateTime = (value?: string | null): string =>
  value
    ? new Date(value).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
    : '—'

export const formatTime = (value?: string | null): string =>
  value ? new Date(value).toLocaleTimeString('en-US', { timeStyle: 'short' }) : '—'

/** "12m ago" / "2h ago" — used by the kitchen board and device list. */
export const formatRelative = (value?: string | null): string => {
  if (!value) return '—'
  const seconds = Math.round((Date.now() - new Date(value).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.round(hours / 24)}d ago`
}

/** Whole minutes elapsed since `value`, floored at 0. */
export const minutesSince = (value?: string | null): number =>
  value ? Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000)) : 0

/** 'fixed_amount' -> 'Fixed amount' */
export const humanize = (value: string): string =>
  value.replace(/[_-]/g, ' ').replace(/^\w/, (char) => char.toUpperCase())
