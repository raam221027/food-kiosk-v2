import { CAlert, CButton } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilInfo, cilReload } from '@coreui/icons'

interface FallbackNoticeProps {
  /** Endpoint the view tried to read, e.g. "/api/orders". */
  endpoint: string
  onRetry?: () => void
}

/**
 * Shown whenever a view is rendering placeholder data because its endpoint is
 * unavailable — without it the sample numbers would read as real.
 */
const FallbackNotice = ({ endpoint, onRetry }: FallbackNoticeProps) => (
  <CAlert
    color="warning"
    className="d-flex align-items-center justify-content-between gap-3 py-2"
  >
    <span className="d-flex align-items-center gap-2 small">
      <CIcon icon={cilInfo} />
      Showing sample data — <code className="mx-1">{endpoint}</code> is not available yet.
    </span>
    {onRetry && (
      <CButton color="warning" variant="outline" size="sm" onClick={onRetry}>
        <CIcon icon={cilReload} className="me-1" />
        Retry
      </CButton>
    )}
  </CAlert>
)

export default FallbackNotice
