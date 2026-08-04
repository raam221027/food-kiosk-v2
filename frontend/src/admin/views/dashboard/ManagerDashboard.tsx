import { useMemo } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CProgress,
  CRow,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import { CChartLine } from '@coreui/react-chartjs'
import { getStyle } from '@coreui/utils'
import { cilBasket, cilCart, cilMoney, cilPeople } from '@coreui/icons'

import { EmptyState, FallbackNotice, PageHeader, StatTile, StatusBadge } from '../../components/common'
import { useAdminResource } from '../../hooks/useAdminResource'
import { sampleOrders, sampleRevenueSeries, sampleTopProducts } from '../../data/samples'
import type { Order } from '../../domain'
import { formatCurrency, formatNumber, toNumber } from '../../utils/format'
import { getOrders } from '@/services/orderService'

/** Trading overview for managers: revenue, volume and what is selling. */
const ManagerDashboard = () => {
  const { data: orders, isFallback, refetch } = useAdminResource<Order[]>(
    ['admin', 'orders'],
    getOrders,
    sampleOrders,
  )

  const stats = useMemo(() => {
    const completed = orders.filter((order) => order.order_status === 'completed')
    const revenue = completed.reduce((total, order) => total + toNumber(order.total_amount), 0)
    const open = orders.filter((order) =>
      ['pending', 'preparing', 'ready'].includes(order.order_status),
    ).length
    const cancelled = orders.filter((order) => order.order_status === 'cancelled').length

    return {
      revenue,
      completed: completed.length,
      open,
      average: completed.length ? revenue / completed.length : 0,
      // Share of all finished tickets that were voided rather than sold.
      cancelRate: orders.length ? (cancelled / orders.length) * 100 : 0,
    }
  }, [orders])

  const weekRevenue = sampleRevenueSeries.reduce((total, day) => total + day.revenue, 0)
  const bestSeller = sampleTopProducts[0]

  return (
    <>
      <PageHeader
        title="Manager dashboard"
        subtitle="Trading performance across the last seven days."
      />

      {isFallback && <FallbackNotice endpoint="/api/orders" onRetry={refetch} />}

      <CRow className="mb-4" xs={{ gutter: 4 }}>
        <CCol sm={6} xl={3}>
          <StatTile
            label="Revenue today"
            value={formatCurrency(stats.revenue)}
            icon={cilMoney}
            color="success"
            hint={`${stats.completed} completed tickets`}
          />
        </CCol>
        <CCol sm={6} xl={3}>
          <StatTile
            label="Average ticket"
            value={formatCurrency(stats.average)}
            icon={cilBasket}
            color="primary"
          />
        </CCol>
        <CCol sm={6} xl={3}>
          <StatTile label="Open orders" value={stats.open} icon={cilCart} color="warning" />
        </CCol>
        <CCol sm={6} xl={3}>
          <StatTile
            label="Week to date"
            value={formatCurrency(weekRevenue)}
            icon={cilPeople}
            color="info"
            hint={bestSeller ? `Top seller: ${bestSeller.name}` : undefined}
          />
        </CCol>
      </CRow>

      <CCard className="mb-4">
        <CCardHeader>Revenue and order volume</CCardHeader>
        <CCardBody>
          <CChartLine
            style={{ height: '300px' }}
            data={{
              labels: sampleRevenueSeries.map((day) => day.label),
              datasets: [
                {
                  label: 'Revenue',
                  backgroundColor: `rgba(${getStyle('--cui-info-rgb')}, .1)`,
                  borderColor: getStyle('--cui-info'),
                  pointBackgroundColor: getStyle('--cui-info'),
                  data: sampleRevenueSeries.map((day) => day.revenue),
                  fill: true,
                  yAxisID: 'y',
                },
                {
                  label: 'Orders',
                  backgroundColor: 'transparent',
                  borderColor: getStyle('--cui-success'),
                  pointBackgroundColor: getStyle('--cui-success'),
                  borderDash: [6, 4],
                  data: sampleRevenueSeries.map((day) => day.orders),
                  yAxisID: 'y1',
                },
              ],
            }}
            options={{
              maintainAspectRatio: false,
              interaction: { intersect: false, mode: 'index' },
              scales: {
                y: {
                  position: 'left',
                  title: { display: true, text: 'Revenue' },
                },
                y1: {
                  position: 'right',
                  title: { display: true, text: 'Orders' },
                  grid: { drawOnChartArea: false },
                },
              },
            }}
          />
        </CCardBody>
      </CCard>

      <CRow>
        <CCol xl={7}>
          <CCard className="mb-4">
            <CCardHeader>Top products</CCardHeader>
            <CCardBody>
              <CTable align="middle" className="mb-0 border" hover responsive>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell className="bg-body-tertiary">Product</CTableHeaderCell>
                    <CTableHeaderCell className="bg-body-tertiary text-end">Sold</CTableHeaderCell>
                    <CTableHeaderCell className="bg-body-tertiary text-end">
                      Revenue
                    </CTableHeaderCell>
                    <CTableHeaderCell className="bg-body-tertiary">Share</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {sampleTopProducts.map((product) => (
                    <CTableRow key={product.name}>
                      <CTableDataCell>{product.name}</CTableDataCell>
                      <CTableDataCell className="text-end">
                        {formatNumber(product.sold)}
                      </CTableDataCell>
                      <CTableDataCell className="text-end fw-semibold">
                        {formatCurrency(product.revenue)}
                      </CTableDataCell>
                      <CTableDataCell style={{ minWidth: '8rem' }}>
                        <CProgress
                          thin
                          color="success"
                          value={
                            bestSeller ? Math.round((product.sold / bestSeller.sold) * 100) : 0
                          }
                        />
                      </CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol xl={5}>
          <CCard className="mb-4">
            <CCardHeader>Recent orders</CCardHeader>
            <CCardBody>
              {orders.length === 0 ? (
                <EmptyState title="No orders yet today" />
              ) : (
                <CTable align="middle" className="mb-0 border" hover responsive>
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell className="bg-body-tertiary">Order</CTableHeaderCell>
                      <CTableHeaderCell className="bg-body-tertiary">Status</CTableHeaderCell>
                      <CTableHeaderCell className="bg-body-tertiary text-end">
                        Total
                      </CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {orders.slice(0, 6).map((order) => (
                      <CTableRow key={order.id}>
                        <CTableDataCell>
                          <div className="fw-semibold">{order.order_number}</div>
                          <div className="small text-body-secondary text-truncate">
                            {order.customer_name}
                          </div>
                        </CTableDataCell>
                        <CTableDataCell>
                          <StatusBadge value={order.order_status} />
                        </CTableDataCell>
                        <CTableDataCell className="text-end fw-semibold text-nowrap">
                          {formatCurrency(order.total_amount)}
                        </CTableDataCell>
                      </CTableRow>
                    ))}
                  </CTableBody>
                </CTable>
              )}
              <div className="text-body-secondary small mt-3">
                Cancellation rate {stats.cancelRate.toFixed(1)}% of tickets.
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </>
  )
}

export default ManagerDashboard
