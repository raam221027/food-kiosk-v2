import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  /** Buttons or filters aligned to the right on md+ screens. */
  actions?: ReactNode
}

/** Title block shared by every admin view, so headings stay consistent. */
const PageHeader = ({ title, subtitle, actions }: PageHeaderProps) => (
  <div className="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-4">
    <div>
      <h1 className="h4 mb-1">{title}</h1>
      {subtitle && <div className="text-body-secondary small">{subtitle}</div>}
    </div>
    {actions && <div className="d-flex flex-wrap gap-2">{actions}</div>}
  </div>
)

export default PageHeader
