import type { ReactNode } from 'react'
import { CCard, CCardBody } from '@coreui/react'
import CIcon from '@coreui/icons-react'

interface StatTileProps {
  label: string
  value: ReactNode
  /** CoreUI icon definition, e.g. `cilCart`. */
  icon?: string[]
  /** CoreUI theme colour used for the icon chip and left border. */
  color?: string
  hint?: string
}

/**
 * Compact metric card. Deliberately quieter than CWidgetStatsA — these sit
 * above dense tables where a full-bleed coloured widget would dominate.
 */
const StatTile = ({ label, value, icon, color = 'primary', hint }: StatTileProps) => (
  <CCard className={`h-100 border-start border-start-4 border-start-${color}`}>
    <CCardBody className="d-flex align-items-center gap-3">
      {icon && (
        <span
          className={`d-inline-flex align-items-center justify-content-center rounded bg-${color}-subtle text-${color}-emphasis`}
          style={{ width: '2.5rem', height: '2.5rem', flexShrink: 0 }}
        >
          <CIcon icon={icon} size="lg" />
        </span>
      )}
      <div className="min-w-0">
        <div className="text-body-secondary text-uppercase small fw-semibold">{label}</div>
        <div className="fs-5 fw-semibold text-truncate">{value}</div>
        {hint && <div className="small text-body-secondary">{hint}</div>}
      </div>
    </CCardBody>
  </CCard>
)

export default StatTile
