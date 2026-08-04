import CIcon from '@coreui/icons-react'
import { cilInbox } from '@coreui/icons'

interface EmptyStateProps {
  title: string
  description?: string
}

/** Placeholder row/panel for tables and boards with nothing to show. */
const EmptyState = ({ title, description }: EmptyStateProps) => (
  <div className="text-center text-body-secondary py-5">
    <CIcon icon={cilInbox} size="xl" className="mb-2" />
    <div className="fw-semibold">{title}</div>
    {description && <div className="small">{description}</div>}
  </div>
)

export default EmptyState
