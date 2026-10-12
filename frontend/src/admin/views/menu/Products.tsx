import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  CAlert,
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCol,
  CFormInput,
  CFormSelect,
  CFormSwitch,
  CRow,
  CSpinner,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilBan, cilFastfood, cilLowVision, cilPencil, cilPlus, cilTrash } from '@coreui/icons'

import { EmptyState, PageHeader, StatTile } from '../../components/common'
import Thumbnail from '../../components/menu/Thumbnail'
import type { Product } from '../../domain'
import { apiErrorMessage } from '../../utils/apiError'
import { formatCurrency, toNumber } from '../../utils/format'
import ProductFormModal from './ProductFormModal'
import { getManagerCategories } from '@/services/categoryService'
import { getModifierGroups } from '@/services/modifierService'
import {
  deleteProduct,
  getManagerProducts,
  updateProductStatus,
  type ProductStatus,
} from '@/services/productService'

type StatusFilter = 'all' | 'live' | 'sold-out' | 'hidden'

/** `null` = modal closed, `'new'` = creating, otherwise the product being edited. */
type Editing = Product | 'new' | null

const priceLabel = (product: Product) => {
  const prices = (product.variants ?? []).map((variant) => toNumber(variant.price))
  if (prices.length < 2) return formatCurrency(prices[0] ?? product.price)
  const low = Math.min(...prices)
  const high = Math.max(...prices)
  return low === high ? formatCurrency(low) : `${formatCurrency(low)} – ${formatCurrency(high)}`
}

/**
 * Menu items: add and edit products, upload images, and flip kiosk visibility
 * or sold-out status straight from the list.
 */
const Products = () => {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<Editing>(null)
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')

  const products = useQuery({ queryKey: ['manager', 'products'], queryFn: getManagerProducts })
  const categories = useQuery({ queryKey: ['manager', 'categories'], queryFn: getManagerCategories })
  const modifierGroups = useQuery({
    queryKey: ['manager', 'modifier-groups'],
    queryFn: getModifierGroups,
  })

  const all = useMemo(() => products.data ?? [], [products.data])

  const toggle = useMutation({
    mutationFn: ({ id, change }: { id: number; change: ProductStatus }) =>
      updateProductStatus(id, change),
    onSuccess: (updated) => {
      queryClient.setQueryData<Product[]>(['manager', 'products'], (current) =>
        current?.map((product) => (product.id === updated.id ? updated : product)),
      )
      // The kiosk caches its menu; refresh it so the change shows up there too.
      void queryClient.invalidateQueries({ queryKey: ['kiosk'] })
    },
  })

  const remove = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['manager'] }),
  })

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase()
    return all.filter((product) => {
      if (categoryId && String(product.category_id) !== categoryId) return false
      if (status === 'live' && !(product.is_active && product.is_available)) return false
      if (status === 'sold-out' && !(product.is_active && !product.is_available)) return false
      if (status === 'hidden' && product.is_active) return false
      if (!term) return true
      return product.name.toLowerCase().includes(term) || product.sku.toLowerCase().includes(term)
    })
  }, [all, search, categoryId, status])

  const counts = useMemo(
    () => ({
      live: all.filter((product) => product.is_active && product.is_available).length,
      soldOut: all.filter((product) => product.is_active && !product.is_available).length,
      hidden: all.filter((product) => !product.is_active).length,
    }),
    [all],
  )

  const confirmDelete = (product: Product) => {
    if (window.confirm(`Delete "${product.name}"? This cannot be undone.`)) {
      remove.mutate(product.id)
    }
  }

  const actionError = toggle.error ?? remove.error

  return (
    <>
      <PageHeader
        title="Products"
        subtitle="Food and drinks on the kiosk menu."
        actions={
          <CButton color="primary" onClick={() => setEditing('new')}>
            <CIcon icon={cilPlus} className="me-1" />
            New product
          </CButton>
        }
      />

      <CRow className="mb-4" xs={{ gutter: 3 }}>
        <CCol sm={6} xl={3}>
          <StatTile label="Products" value={all.length} icon={cilFastfood} color="primary" />
        </CCol>
        <CCol sm={6} xl={3}>
          <StatTile label="On the kiosk" value={counts.live} icon={cilFastfood} color="success" />
        </CCol>
        <CCol sm={6} xl={3}>
          <StatTile label="Sold out" value={counts.soldOut} icon={cilBan} color="warning" />
        </CCol>
        <CCol sm={6} xl={3}>
          <StatTile label="Hidden" value={counts.hidden} icon={cilLowVision} color="secondary" />
        </CCol>
      </CRow>

      {products.isError && (
        <CAlert color="danger">Could not load products: {apiErrorMessage(products.error)}</CAlert>
      )}
      {actionError && (
        <CAlert color="danger" dismissible onClose={() => (toggle.reset(), remove.reset())}>
          {apiErrorMessage(actionError)}
        </CAlert>
      )}

      <CCard className="mb-4">
        <CCardBody>
          <CRow className="g-2 mb-3">
            <CCol md={5}>
              <CFormInput
                type="search"
                placeholder="Search by name or SKU"
                aria-label="Search products"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </CCol>
            <CCol sm={6} md={4}>
              <CFormSelect
                aria-label="Filter by category"
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
              >
                <option value="">All categories</option>
                {(categories.data ?? []).map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </CFormSelect>
            </CCol>
            <CCol sm={6} md={3}>
              <CFormSelect
                aria-label="Filter by status"
                value={status}
                onChange={(event) => setStatus(event.target.value as StatusFilter)}
              >
                <option value="all">Any status</option>
                <option value="live">On the kiosk</option>
                <option value="sold-out">Sold out</option>
                <option value="hidden">Hidden</option>
              </CFormSelect>
            </CCol>
          </CRow>

          {products.isLoading ? (
            <div className="text-center py-5">
              <CSpinner color="primary" />
            </div>
          ) : visible.length === 0 ? (
            <EmptyState
              title={all.length ? 'No products match these filters' : 'No products yet'}
              description={all.length ? undefined : 'Add your first menu item to get started.'}
            />
          ) : (
            <CTable align="middle" className="mb-0 border" hover responsive>
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell className="bg-body-tertiary">Product</CTableHeaderCell>
                  <CTableHeaderCell className="bg-body-tertiary">Category</CTableHeaderCell>
                  <CTableHeaderCell className="bg-body-tertiary text-end">Price</CTableHeaderCell>
                  <CTableHeaderCell className="bg-body-tertiary text-center">On kiosk</CTableHeaderCell>
                  <CTableHeaderCell className="bg-body-tertiary text-center">Sold out</CTableHeaderCell>
                  <CTableHeaderCell className="bg-body-tertiary" />
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {visible.map((product) => {
                  const busy = toggle.isPending && toggle.variables?.id === product.id

                  return (
                    <CTableRow key={product.id} className={product.is_active ? undefined : 'opacity-75'}>
                      <CTableDataCell>
                        <div className="d-flex align-items-center gap-3">
                          <Thumbnail image={product.image} />
                          <div className="min-w-0">
                            <div className="fw-semibold">
                              {product.name}
                              {product.is_combo && (
                                <CBadge color="info" className="ms-2">
                                  Combo
                                </CBadge>
                              )}
                            </div>
                            <div className="small text-body-secondary">
                              {product.sku}
                              {!!product.variants?.length && ` · ${product.variants.length} sizes`}
                              {!!product.modifier_groups?.length &&
                                ` · ${product.modifier_groups.map((group) => group.name).join(', ')}`}
                            </div>
                          </div>
                        </div>
                      </CTableDataCell>
                      <CTableDataCell>{product.category?.name ?? '—'}</CTableDataCell>
                      <CTableDataCell className="text-end fw-semibold text-nowrap">
                        {priceLabel(product)}
                      </CTableDataCell>
                      <CTableDataCell className="text-center">
                        <CFormSwitch
                          className="d-inline-block"
                          aria-label={`Show ${product.name} on the kiosk`}
                          checked={product.is_active ?? true}
                          disabled={busy}
                          onChange={(event) =>
                            toggle.mutate({ id: product.id, change: { is_active: event.target.checked } })
                          }
                        />
                      </CTableDataCell>
                      <CTableDataCell className="text-center">
                        <CFormSwitch
                          className="d-inline-block"
                          aria-label={`Mark ${product.name} as sold out`}
                          checked={!product.is_available}
                          disabled={busy}
                          onChange={(event) =>
                            toggle.mutate({
                              id: product.id,
                              change: { is_available: !event.target.checked },
                            })
                          }
                        />
                      </CTableDataCell>
                      <CTableDataCell className="text-end text-nowrap">
                        <CButton
                          color="secondary"
                          variant="ghost"
                          size="sm"
                          aria-label={`Edit ${product.name}`}
                          onClick={() => setEditing(product)}
                        >
                          <CIcon icon={cilPencil} />
                        </CButton>
                        <CButton
                          color="danger"
                          variant="ghost"
                          size="sm"
                          aria-label={`Delete ${product.name}`}
                          disabled={remove.isPending}
                          onClick={() => confirmDelete(product)}
                        >
                          <CIcon icon={cilTrash} />
                        </CButton>
                      </CTableDataCell>
                    </CTableRow>
                  )
                })}
              </CTableBody>
            </CTable>
          )}
        </CCardBody>
      </CCard>

      {editing !== null && (
        <ProductFormModal
          key={editing === 'new' ? 'new' : editing.id}
          product={editing === 'new' ? null : editing}
          categories={categories.data ?? []}
          modifierGroups={modifierGroups.data ?? []}
          products={all}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  )
}

export default Products
