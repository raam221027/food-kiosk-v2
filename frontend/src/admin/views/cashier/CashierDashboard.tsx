import { useMemo, useState } from 'react'
import {
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CRow,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilCart, cilCreditCard, cilMoney, cilSearch } from '@coreui/icons'

import { EmptyState, FallbackNotice, PageHeader, StatTile, StatusBadge } from '../../components/common'
import { useAdminResource } from '../../hooks/useAdminResource'
import { samplePayments } from '../../data/samples'
import type { Payment } from '../../domain'
import { formatCurrency, formatTime, humanize, toNumber } from '../../utils/format'
import { getPayments } from '@/services/paymentService'

/** Counter view: what has been taken today and what is still owed. */
const CashierDashboard = () => {
  const { data: payments, isFallback, refetch } = useAdminResource<Payment[]>(
    ['admin', 'payments'],
    getPayments,
    samplePayments,
  )

  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return payments
    return payments.filter(
      (payment) =>
        payment.order?.order_number.toLowerCase().includes(term) ||
        payment.order?.customer_name.toLowerCase().includes(term) ||
        payment.transaction_id?.toLowerCase().includes(term),
    )
  }, [payments, search])

  const totals = useMemo(() => {
    const settled = payments.filter((payment) => payment.status === 'completed')
    const sumBy = (type: string) =>
      settled
        .filter((payment) => payment.payment_method?.type === type)
        .reduce((total, payment) => total + toNumber(payment.amount), 0)

    return {
      cash: sumBy('cash'),
      card: sumBy('card') + sumBy('mobile_payment'),
      taken: settled.reduce((total, payment) => total + toNumber(payment.amount), 0),
      outstanding: payments
        .filter((payment) => payment.status === 'pending')
        .reduce((total, payment) => total + toNumber(payment.amount), 0),
    }
  }, [payments])

  return (
    <>
      <PageHeader
        title="Cashier Dashboard"
        subtitle="Payments taken at this counter today."
        actions={
          <CButton color="primary" variant="outline" onClick={refetch}>
            Refresh
          </CButton>
        }
      />

      {isFallback && <FallbackNotice endpoint="/api/payments" onRetry={refetch} />}

      <CRow className="mb-4" xs={{ gutter: 4 }}>
        <CCol sm={6} xl={3}>
          <StatTile
            label="Taken today"
            value={formatCurrency(totals.taken)}
            icon={cilMoney}
            color="success"
          />
        </CCol>
        <CCol sm={6} xl={3}>
          <StatTile label="Cash" value={formatCurrency(totals.cash)} icon={cilMoney} color="info" />
        </CCol>
        <CCol sm={6} xl={3}>
          <StatTile
            label="Card and mobile"
            value={formatCurrency(totals.card)}
            icon={cilCreditCard}
            color="primary"
          />
        </CCol>
        <CCol sm={6} xl={3}>
          <StatTile
            label="Awaiting payment"
            value={formatCurrency(totals.outstanding)}
            icon={cilCart}
            color={totals.outstanding > 0 ? 'warning' : 'secondary'}
          />
        </CCol>
      </CRow>

      <CCard className="mb-4">
        <CCardHeader>Transactions</CCardHeader>
        <CCardBody>
          <CRow className="mb-3">
            <CCol md={5}>
              <CInputGroup>
                <CInputGroupText>
                  <CIcon icon={cilSearch} />
                </CInputGroupText>
                <CFormInput
                  placeholder="Search order, customer or transaction"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  aria-label="Search transactions"
                />
              </CInputGroup>
            </CCol>
          </CRow>

          {filtered.length === 0 ? (
            <EmptyState
              title="No transactions match"
              description="Clear the search to see everything taken today."
            />
          ) : (
            <CTable align="middle" className="mb-0 border" hover responsive>
              <CTableHead className="text-nowrap">
                <CTableRow>
                  <CTableHeaderCell className="bg-body-tertiary">Order</CTableHeaderCell>
                  <CTableHeaderCell className="bg-body-tertiary">Customer</CTableHeaderCell>
                  <CTableHeaderCell className="bg-body-tertiary">Method</CTableHeaderCell>
                  <CTableHeaderCell className="bg-body-tertiary">Status</CTableHeaderCell>
                  <CTableHeaderCell className="bg-body-tertiary text-end">Amount</CTableHeaderCell>
                  <CTableHeaderCell className="bg-body-tertiary">Paid</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {filtered.map((payment) => (
                  <CTableRow key={payment.id}>
                    <CTableDataCell className="fw-semibold text-nowrap">
                      {payment.order?.order_number ?? `#${payment.order_id}`}
                    </CTableDataCell>
                    <CTableDataCell>{payment.order?.customer_name ?? '—'}</CTableDataCell>
                    <CTableDataCell className="text-nowrap">
                      {payment.payment_method
                        ? `${payment.payment_method.name} (${humanize(payment.payment_method.type)})`
                        : '—'}
                    </CTableDataCell>
                    <CTableDataCell>
                      <StatusBadge value={payment.status} />
                    </CTableDataCell>
                    <CTableDataCell className="text-end fw-semibold text-nowrap">
                      {formatCurrency(payment.amount)}
                    </CTableDataCell>
                    <CTableDataCell className="small text-body-secondary text-nowrap">
                      {formatTime(payment.paid_at)}
                    </CTableDataCell>
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>
          )}
        </CCardBody>
      </CCard>
    </>
  )
}

export default CashierDashboard
