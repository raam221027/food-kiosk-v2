import { useMemo, useState } from 'react'
import {
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CListGroup,
  CListGroupItem,
  CRow,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilClock, cilFastfood, cilRestaurant } from '@coreui/icons'

import { EmptyState, FallbackNotice, PageHeader, StatTile, StatusBadge } from '../../components/common'
import { useAdminResource } from '../../hooks/useAdminResource'
import { sampleKitchenOrders } from '../../data/samples'
import type { KitchenOrder, KitchenStatus } from '../../domain'
import { humanize, minutesSince } from '../../utils/format'
import { getKitchenData } from '@/services/kitchenService'

/** Board columns, in the order a ticket moves through them. */
const COLUMNS: { status: KitchenStatus; title: string; color: string }[] = [
  { status: 'pending', title: 'Queued', color: 'secondary' },
  { status: 'preparing', title: 'In progress', color: 'warning' },
  { status: 'ready', title: 'Ready to serve', color: 'info' },
]

const NEXT_STATUS: Partial<Record<KitchenStatus, KitchenStatus>> = {
  pending: 'preparing',
  preparing: 'ready',
  ready: 'completed',
}

/** A ticket sitting this long without moving needs attention. */
const LATE_AFTER_MINUTES = 10

const KitchenDashboard = () => {
  const { data, isFallback, refetch } = useAdminResource<KitchenOrder[]>(
    ['admin', 'kitchen'],
    getKitchenData,
    sampleKitchenOrders,
  )

  // Status advances are local until the backend exposes a kitchen endpoint.
  const [statusEdits, setStatusEdits] = useState<Record<number, KitchenStatus>>({})

  const tickets = useMemo(
    () => data.map((ticket) => ({ ...ticket, status: statusEdits[ticket.id] ?? ticket.status })),
    [data, statusEdits],
  )

  const active = tickets.filter((ticket) => ticket.status !== 'completed')
  const late = active.filter((ticket) => minutesSince(ticket.created_at) >= LATE_AFTER_MINUTES)

  const advance = (ticket: KitchenOrder) => {
    const next = NEXT_STATUS[ticket.status]
    if (next) {
      setStatusEdits((edits) => ({ ...edits, [ticket.id]: next }))
    }
  }

  return (
    <>
      <PageHeader
        title="Kitchen display"
        subtitle="Live tickets, oldest first. Advance a ticket as it moves through the pass."
      />

      {isFallback && <FallbackNotice endpoint="/api/kitchen" onRetry={refetch} />}

      <CRow className="mb-4" xs={{ gutter: 4 }}>
        <CCol sm={4}>
          <StatTile
            label="Active tickets"
            value={active.length}
            icon={cilFastfood}
            color="primary"
          />
        </CCol>
        <CCol sm={4}>
          <StatTile
            label="Waiting over 10 min"
            value={late.length}
            icon={cilClock}
            color={late.length > 0 ? 'danger' : 'success'}
          />
        </CCol>
        <CCol sm={4}>
          <StatTile
            label="Served today"
            value={tickets.filter((ticket) => ticket.status === 'completed').length}
            icon={cilRestaurant}
            color="success"
          />
        </CCol>
      </CRow>

      <CRow xs={{ gutter: 4 }}>
        {COLUMNS.map((column) => {
          const columnTickets = tickets
            .filter((ticket) => ticket.status === column.status)
            .sort(
              (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
            )

          return (
            <CCol key={column.status} md={4}>
              <CCard className="h-100">
                <CCardHeader className="d-flex align-items-center justify-content-between">
                  <span className="fw-semibold">{column.title}</span>
                  <CBadge color={column.color} shape="rounded-pill">
                    {columnTickets.length}
                  </CBadge>
                </CCardHeader>
                <CCardBody className="d-flex flex-column gap-3">
                  {columnTickets.length === 0 ? (
                    <EmptyState title="Nothing here" />
                  ) : (
                    columnTickets.map((ticket) => {
                      const waiting = minutesSince(ticket.created_at)
                      const isLate = waiting >= LATE_AFTER_MINUTES

                      return (
                        <CCard
                          key={ticket.id}
                          className={`border-start border-start-4 border-start-${
                            isLate ? 'danger' : column.color
                          }`}
                        >
                          <CCardBody className="p-3">
                            <div className="d-flex align-items-start justify-content-between mb-2">
                              <div>
                                <div className="fw-semibold">
                                  {ticket.order?.order_number ?? `Order #${ticket.order_id}`}
                                </div>
                                <div className="small text-body-secondary">
                                  {ticket.order?.customer_name ?? 'Walk-in'}
                                  {ticket.order?.order_type &&
                                    ` · ${humanize(ticket.order.order_type)}`}
                                </div>
                              </div>
                              <StatusBadge value={ticket.priority} />
                            </div>

                            <CListGroup flush className="mb-2">
                              {(ticket.order?.items ?? []).map((item) => (
                                <CListGroupItem
                                  key={item.id}
                                  className="px-0 py-1 border-0 d-flex justify-content-between"
                                >
                                  <span>{item.product_name}</span>
                                  <span className="fw-semibold ms-2">×{item.quantity}</span>
                                </CListGroupItem>
                              ))}
                            </CListGroup>

                            {ticket.order?.notes && (
                              <div className="small bg-body-tertiary rounded px-2 py-1 mb-2">
                                {ticket.order.notes}
                              </div>
                            )}

                            <div className="d-flex align-items-center justify-content-between">
                              <span
                                className={`small ${isLate ? 'text-danger fw-semibold' : 'text-body-secondary'}`}
                              >
                                <CIcon icon={cilClock} className="me-1" />
                                {waiting} min
                              </span>
                              <CButton color={column.color} size="sm" onClick={() => advance(ticket)}>
                                {column.status === 'ready' ? 'Complete' : 'Advance'}
                              </CButton>
                            </div>
                          </CCardBody>
                        </CCard>
                      )
                    })
                  )}
                </CCardBody>
              </CCard>
            </CCol>
          )
        })}
      </CRow>
    </>
  )
}

export default KitchenDashboard
