import { useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import {
  CAlert,
  CButton,
  CButtonGroup,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CFormInput,
  CListGroup,
  CListGroupItem,
  CProgress,
  CRow,
  CSpinner,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import { CChartBar, CChartLine } from '@coreui/react-chartjs'
import { getStyle } from '@coreui/utils'
import CIcon from '@coreui/icons-react'
import { cilBan, cilBasket, cilCloudDownload, cilMoney, cilCart } from '@coreui/icons'

import { EmptyState, PageHeader, StatTile, StatusBadge } from '../../components/common'
import type { SalesReport } from '../../domain'
import { apiErrorMessage } from '../../utils/apiError'
import { formatCurrency, formatNumber, formatPercent, humanize } from '../../utils/format'
import { getSalesReport } from '@/services/reportService'

/** YYYY-MM-DD in the browser's local time (toISOString would shift to UTC). */
const isoDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

const lastDays = (days: number) => {
  const to = new Date()
  const from = new Date()
  from.setDate(to.getDate() - (days - 1))
  return { from: isoDate(from), to: isoDate(to) }
}

const PRESETS = [
  { label: 'Today', days: 1 },
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 },
  { label: '90 days', days: 90 },
]

const shortDate = (value: string) =>
  new Date(`${value}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

const hourLabel = (hour: number) => `${hour % 12 || 12}${hour < 12 ? 'a' : 'p'}`

/** Daily figures and top products as a CSV download. */
const exportCsv = (report: SalesReport) => {
  const quote = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`
  const lines = [
    ['Date', 'Orders', 'Revenue'],
    ...report.daily.map((day) => [day.date, day.orders, day.revenue.toFixed(2)]),
    [],
    ['Product', 'Sold', 'Revenue'],
    ...report.top_products.map((product) => [product.name, product.sold, product.revenue.toFixed(2)]),
  ]
  const blob = new Blob([lines.map((line) => line.map(quote).join(',')).join('\n')], {
    type: 'text/csv',
  })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `sales-${report.range.from}-to-${report.range.to}.csv`
  link.click()
  URL.revokeObjectURL(link.href)
}

/** Sales and operational reports for managers, over a chosen date range. */
const Reports = () => {
  const [range, setRange] = useState(() => lastDays(7))

  const report = useQuery({
    queryKey: ['manager', 'reports', 'sales', range],
    queryFn: () => getSalesReport(range),
    // Keep the old numbers on screen while a new range loads.
    placeholderData: keepPreviousData,
  })

  const data = report.data
  const activePreset = PRESETS.find((preset) => {
    const candidate = lastDays(preset.days)
    return candidate.from === range.from && candidate.to === range.to
  })

  const primary = getStyle('--cui-primary')
  const gridColor = getStyle('--cui-border-color-translucent')
  const tickColor = getStyle('--cui-body-color')

  const axes = {
    x: { grid: { display: false }, ticks: { color: tickColor } },
    y: { beginAtZero: true, grid: { color: gridColor }, border: { display: false }, ticks: { color: tickColor } },
  }

  return (
    <>
      <PageHeader
        title="Reports"
        subtitle={
          data ? `${shortDate(data.range.from)} – ${shortDate(data.range.to)}` : 'Sales and operations'
        }
        actions={
          <>
            <CButtonGroup role="group" aria-label="Date range">
              {PRESETS.map((preset) => (
                <CButton
                  key={preset.label}
                  color="secondary"
                  variant={activePreset === preset ? undefined : 'outline'}
                  onClick={() => setRange(lastDays(preset.days))}
                >
                  {preset.label}
                </CButton>
              ))}
            </CButtonGroup>
            <div className="d-flex align-items-center gap-1">
              <CFormInput
                type="date"
                aria-label="From"
                value={range.from}
                max={range.to}
                onChange={(event) => event.target.value && setRange({ ...range, from: event.target.value })}
              />
              <span className="text-body-secondary">–</span>
              <CFormInput
                type="date"
                aria-label="To"
                value={range.to}
                min={range.from}
                onChange={(event) => event.target.value && setRange({ ...range, to: event.target.value })}
              />
            </div>
            <CButton color="primary" variant="outline" disabled={!data} onClick={() => data && exportCsv(data)}>
              <CIcon icon={cilCloudDownload} className="me-1" />
              CSV
            </CButton>
          </>
        }
      />

      {report.isError && (
        <CAlert color="danger">Could not load the report: {apiErrorMessage(report.error)}</CAlert>
      )}

      {!data ? (
        report.isLoading && (
          <div className="text-center py-5">
            <CSpinner color="primary" />
          </div>
        )
      ) : (
        <div style={{ opacity: report.isFetching ? 0.6 : 1, transition: 'opacity .15s' }}>
          <CRow className="mb-4" xs={{ gutter: 3 }}>
            <CCol sm={6} xl={3}>
              <StatTile
                label="Revenue"
                value={formatCurrency(data.summary.revenue)}
                icon={cilMoney}
                color="success"
                hint={`${formatCurrency(data.summary.tax)} tax · ${formatCurrency(data.summary.discounts)} discounts`}
              />
            </CCol>
            <CCol sm={6} xl={3}>
              <StatTile label="Orders" value={formatNumber(data.summary.orders)} icon={cilCart} color="primary" />
            </CCol>
            <CCol sm={6} xl={3}>
              <StatTile
                label="Average ticket"
                value={formatCurrency(data.summary.average_ticket)}
                icon={cilBasket}
                color="info"
              />
            </CCol>
            <CCol sm={6} xl={3}>
              <StatTile
                label="Cancelled"
                value={formatPercent(data.summary.cancel_rate)}
                icon={cilBan}
                color="danger"
                hint={`${data.summary.cancelled} order(s)`}
              />
            </CCol>
          </CRow>

          <CRow>
            <CCol lg={7}>
              <CCard className="mb-4">
                <CCardHeader>Revenue by day</CCardHeader>
                <CCardBody>
                  <CChartLine
                    style={{ height: '260px' }}
                    data={{
                      labels: data.daily.map((day) => shortDate(day.date)),
                      datasets: [
                        {
                          label: 'Revenue',
                          data: data.daily.map((day) => day.revenue),
                          borderColor: primary,
                          backgroundColor: `rgba(${getStyle('--cui-primary-rgb')}, .1)`,
                          pointBackgroundColor: primary,
                          borderWidth: 2,
                          pointRadius: data.daily.length > 31 ? 0 : 4,
                          pointHoverRadius: 6,
                          fill: true,
                        },
                      ],
                    }}
                    options={{
                      maintainAspectRatio: false,
                      interaction: { intersect: false, mode: 'index' },
                      plugins: {
                        legend: { display: false },
                        tooltip: { callbacks: { label: (item) => `Revenue: ${formatCurrency(item.parsed.y)}` } },
                      },
                      scales: {
                        ...axes,
                        y: { ...axes.y, ticks: { ...axes.y.ticks, callback: (value) => formatCurrency(value) } },
                      },
                    }}
                  />
                </CCardBody>
              </CCard>
            </CCol>
            <CCol lg={5}>
              <CCard className="mb-4">
                <CCardHeader>Orders by hour of day</CCardHeader>
                <CCardBody>
                  <CChartBar
                    style={{ height: '260px' }}
                    data={{
                      labels: data.hourly.map((row) => hourLabel(row.hour)),
                      datasets: [
                        {
                          label: 'Orders',
                          data: data.hourly.map((row) => row.orders),
                          backgroundColor: primary,
                          borderRadius: 4,
                          borderSkipped: 'start',
                        },
                      ],
                    }}
                    options={{
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                      scales: { ...axes, y: { ...axes.y, ticks: { ...axes.y.ticks, precision: 0 } } },
                    }}
                  />
                </CCardBody>
              </CCard>
            </CCol>
          </CRow>

          <CRow>
            <CCol xl={7}>
              <CCard className="mb-4">
                <CCardHeader>Top products</CCardHeader>
                <CCardBody>
                  {data.top_products.length === 0 ? (
                    <EmptyState title="No sales in this period" />
                  ) : (
                    <CTable align="middle" className="mb-0 border" hover responsive>
                      <CTableHead>
                        <CTableRow>
                          <CTableHeaderCell className="bg-body-tertiary">Product</CTableHeaderCell>
                          <CTableHeaderCell className="bg-body-tertiary text-end">Sold</CTableHeaderCell>
                          <CTableHeaderCell className="bg-body-tertiary text-end">Revenue</CTableHeaderCell>
                          <CTableHeaderCell className="bg-body-tertiary">Share of revenue</CTableHeaderCell>
                        </CTableRow>
                      </CTableHead>
                      <CTableBody>
                        {data.top_products.map((product) => (
                          <CTableRow key={`${product.product_id}-${product.name}`}>
                            <CTableDataCell>{product.name}</CTableDataCell>
                            <CTableDataCell className="text-end">{formatNumber(product.sold)}</CTableDataCell>
                            <CTableDataCell className="text-end fw-semibold">
                              {formatCurrency(product.revenue)}
                            </CTableDataCell>
                            <CTableDataCell style={{ minWidth: '8rem' }}>
                              <CProgress
                                thin
                                color="primary"
                                value={data.summary.revenue ? (product.revenue / data.summary.revenue) * 100 : 0}
                              />
                            </CTableDataCell>
                          </CTableRow>
                        ))}
                      </CTableBody>
                    </CTable>
                  )}
                </CCardBody>
              </CCard>

              <CCard className="mb-4">
                <CCardHeader>Sales by category</CCardHeader>
                <CCardBody>
                  {data.by_category.length === 0 ? (
                    <EmptyState title="No sales in this period" />
                  ) : (
                    <CTable align="middle" className="mb-0 border" responsive>
                      <CTableHead>
                        <CTableRow>
                          <CTableHeaderCell className="bg-body-tertiary">Category</CTableHeaderCell>
                          <CTableHeaderCell className="bg-body-tertiary text-end">Items sold</CTableHeaderCell>
                          <CTableHeaderCell className="bg-body-tertiary text-end">Revenue</CTableHeaderCell>
                        </CTableRow>
                      </CTableHead>
                      <CTableBody>
                        {data.by_category.map((category) => (
                          <CTableRow key={category.category_id}>
                            <CTableDataCell>{category.name}</CTableDataCell>
                            <CTableDataCell className="text-end">{formatNumber(category.sold)}</CTableDataCell>
                            <CTableDataCell className="text-end fw-semibold">
                              {formatCurrency(category.revenue)}
                            </CTableDataCell>
                          </CTableRow>
                        ))}
                      </CTableBody>
                    </CTable>
                  )}
                </CCardBody>
              </CCard>
            </CCol>

            <CCol xl={5}>
              <CCard className="mb-4">
                <CCardHeader>Operations</CCardHeader>
                <CListGroup flush>
                  <CListGroupItem>
                    <div className="small text-body-secondary text-uppercase fw-semibold mb-2">
                      Orders by status
                    </div>
                    <div className="d-flex flex-wrap gap-3">
                      {Object.entries(data.by_status).length === 0 && (
                        <span className="small text-body-secondary">No orders</span>
                      )}
                      {Object.entries(data.by_status).map(([status, count]) => (
                        <span key={status} className="d-inline-flex align-items-center gap-1">
                          <StatusBadge value={status} /> <span className="fw-semibold">{count}</span>
                        </span>
                      ))}
                    </div>
                  </CListGroupItem>
                  <CListGroupItem>
                    <div className="small text-body-secondary text-uppercase fw-semibold mb-2">Kitchen</div>
                    <div className="d-flex justify-content-between">
                      <span>Average prep time</span>
                      <span className="fw-semibold">
                        {data.kitchen.average_prep_minutes === null ? '—' : `${data.kitchen.average_prep_minutes} min`}
                      </span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span>Longest prep time</span>
                      <span className="fw-semibold">
                        {data.kitchen.longest_prep_minutes === null ? '—' : `${data.kitchen.longest_prep_minutes} min`}
                      </span>
                    </div>
                    <div className="small text-body-secondary">{data.kitchen.tickets} finished ticket(s)</div>
                  </CListGroupItem>
                  <CListGroupItem>
                    <div className="small text-body-secondary text-uppercase fw-semibold mb-2">Order type</div>
                    {data.by_order_type.length === 0 && <span className="small text-body-secondary">No orders</span>}
                    {data.by_order_type.map((row) => (
                      <div key={row.order_type} className="d-flex justify-content-between">
                        <span>
                          {humanize(row.order_type)} <span className="text-body-secondary">· {row.orders}</span>
                        </span>
                        <span className="fw-semibold">{formatCurrency(row.revenue)}</span>
                      </div>
                    ))}
                  </CListGroupItem>
                  <CListGroupItem>
                    <div className="small text-body-secondary text-uppercase fw-semibold mb-2">
                      Payment methods
                    </div>
                    {data.payment_methods.length === 0 && (
                      <span className="small text-body-secondary">No recorded payments</span>
                    )}
                    {data.payment_methods.map((row) => (
                      <div key={row.name} className="d-flex justify-content-between">
                        <span>
                          {row.name} <span className="text-body-secondary">· {row.payments}</span>
                        </span>
                        <span className="fw-semibold">{formatCurrency(row.amount)}</span>
                      </div>
                    ))}
                  </CListGroupItem>
                  <CListGroupItem>
                    <div className="small text-body-secondary text-uppercase fw-semibold mb-2">
                      Menu right now
                    </div>
                    <div className="d-flex justify-content-between">
                      <span>Products</span>
                      <span className="fw-semibold">{data.menu.total}</span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span>Sold out</span>
                      <span className="fw-semibold">{data.menu.sold_out}</span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span>Hidden from kiosk</span>
                      <span className="fw-semibold">{data.menu.hidden}</span>
                    </div>
                  </CListGroupItem>
                </CListGroup>
              </CCard>
            </CCol>
          </CRow>
        </div>
      )}
    </>
  )
}

export default Reports
