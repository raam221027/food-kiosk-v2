import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  CAlert,
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCol,
  CFormFeedback,
  CFormInput,
  CFormLabel,
  CFormSwitch,
  CFormTextarea,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
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
import { cilPencil, cilPlus, cilTrash } from '@coreui/icons'

import { EmptyState, PageHeader } from '../../components/common'
import ImageField from '../../components/menu/ImageField'
import Thumbnail from '../../components/menu/Thumbnail'
import type { Category } from '../../domain'
import { apiErrorMessage, fieldErrors } from '../../utils/apiError'
import {
  createCategory,
  deleteCategory,
  getManagerCategories,
  updateCategory,
  uploadCategoryImage,
  type CategoryInput,
} from '@/services/categoryService'

const inputFor = (category: Category): CategoryInput => ({
  name: category.name,
  description: category.description ?? null,
  sort_order: category.sort_order,
  is_active: category.is_active,
  requires_size: category.requires_size ?? false,
})

/**
 * Menu sections such as Burgers, Fries and Drinks. The sort order decides the
 * order of the tabs on the kiosk; inactive categories are hidden from it.
 */
const Categories = () => {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<Category | 'new' | null>(null)

  const categories = useQuery({ queryKey: ['manager', 'categories'], queryFn: getManagerCategories })
  const list = categories.data ?? []

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['manager'] })
    void queryClient.invalidateQueries({ queryKey: ['kiosk'] })
  }

  const toggle = useMutation({
    mutationFn: (category: Category) =>
      updateCategory(category.id, { ...inputFor(category), is_active: !category.is_active }),
    onSuccess: refresh,
  })

  const remove = useMutation({ mutationFn: deleteCategory, onSuccess: refresh })

  const confirmDelete = (category: Category) => {
    if (window.confirm(`Delete the "${category.name}" category?`)) remove.mutate(category.id)
  }

  const actionError = toggle.error ?? remove.error

  return (
    <>
      <PageHeader
        title="Categories"
        subtitle="Sections of the kiosk menu, shown in sort order."
        actions={
          <CButton color="primary" onClick={() => setEditing('new')}>
            <CIcon icon={cilPlus} className="me-1" />
            New category
          </CButton>
        }
      />

      {categories.isError && (
        <CAlert color="danger">Could not load categories: {apiErrorMessage(categories.error)}</CAlert>
      )}
      {actionError && (
        <CAlert color="danger" dismissible onClose={() => (toggle.reset(), remove.reset())}>
          {apiErrorMessage(actionError)}
        </CAlert>
      )}

      <CCard className="mb-4">
        <CCardBody>
          {categories.isLoading ? (
            <div className="text-center py-5">
              <CSpinner color="primary" />
            </div>
          ) : list.length === 0 ? (
            <EmptyState title="No categories yet" description="Start with Burgers, Fries or Drinks." />
          ) : (
            <CTable align="middle" className="mb-0 border" hover responsive>
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell className="bg-body-tertiary" style={{ width: '4rem' }}>
                    Order
                  </CTableHeaderCell>
                  <CTableHeaderCell className="bg-body-tertiary">Category</CTableHeaderCell>
                  <CTableHeaderCell className="bg-body-tertiary text-end">Products</CTableHeaderCell>
                  <CTableHeaderCell className="bg-body-tertiary text-center">Active</CTableHeaderCell>
                  <CTableHeaderCell className="bg-body-tertiary" />
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {list.map((category) => (
                  <CTableRow key={category.id}>
                    <CTableDataCell className="text-body-secondary">{category.sort_order}</CTableDataCell>
                    <CTableDataCell>
                      <div className="d-flex align-items-center gap-3">
                        <Thumbnail image={category.image} />
                        <div className="min-w-0">
                          <div className="fw-semibold">
                            {category.name}
                            {category.requires_size && (
                              <CBadge color="info" className="ms-2">
                                S / M / L required
                              </CBadge>
                            )}
                          </div>
                          {category.description && (
                            <div className="small text-body-secondary text-truncate">
                              {category.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </CTableDataCell>
                    <CTableDataCell className="text-end">{category.products_count ?? 0}</CTableDataCell>
                    <CTableDataCell className="text-center">
                      <CFormSwitch
                        className="d-inline-block"
                        aria-label={`Show ${category.name} on the kiosk`}
                        checked={category.is_active}
                        disabled={toggle.isPending && toggle.variables?.id === category.id}
                        onChange={() => toggle.mutate(category)}
                      />
                    </CTableDataCell>
                    <CTableDataCell className="text-end text-nowrap">
                      <CButton
                        color="secondary"
                        variant="ghost"
                        size="sm"
                        aria-label={`Edit ${category.name}`}
                        onClick={() => setEditing(category)}
                      >
                        <CIcon icon={cilPencil} />
                      </CButton>
                      <CButton
                        color="danger"
                        variant="ghost"
                        size="sm"
                        aria-label={`Delete ${category.name}`}
                        disabled={remove.isPending}
                        onClick={() => confirmDelete(category)}
                      >
                        <CIcon icon={cilTrash} />
                      </CButton>
                    </CTableDataCell>
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>
          )}
        </CCardBody>
      </CCard>

      {editing !== null && (
        <CategoryFormModal
          key={editing === 'new' ? 'new' : editing.id}
          category={editing === 'new' ? null : editing}
          nextSortOrder={list.reduce((max, category) => Math.max(max, category.sort_order), 0) + 1}
          onSaved={refresh}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  )
}

interface CategoryFormModalProps {
  category: Category | null
  nextSortOrder: number
  onSaved: () => void
  onClose: () => void
}

const CategoryFormModal = ({ category, nextSortOrder, onSaved, onClose }: CategoryFormModalProps) => {
  const [name, setName] = useState(category?.name ?? '')
  const [description, setDescription] = useState(category?.description ?? '')
  const [sortOrder, setSortOrder] = useState(String(category?.sort_order ?? nextSortOrder))
  const [isActive, setIsActive] = useState(category?.is_active ?? true)
  const [requiresSize, setRequiresSize] = useState(category?.requires_size ?? false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [createdId, setCreatedId] = useState<number | null>(null)

  const save = useMutation({
    mutationFn: async () => {
      const input: CategoryInput = {
        name: name.trim(),
        description: description.trim() || null,
        sort_order: Number(sortOrder) || 0,
        is_active: isActive,
        requires_size: requiresSize,
      }
      // A retry after a failed image upload updates the category just created.
      const id = category?.id ?? createdId
      const saved = id ? await updateCategory(id, input) : await createCategory(input)
      setCreatedId(saved.id)
      return imageFile ? uploadCategoryImage(saved.id, imageFile) : saved
    },
    onSuccess: () => {
      onSaved()
      onClose()
    },
  })

  const errors = fieldErrors(save.error)
  const generalError = save.isError && Object.keys(errors).length === 0 ? apiErrorMessage(save.error) : null

  const submit = (event: FormEvent) => {
    event.preventDefault()
    save.mutate()
  }

  return (
    <CModal visible onClose={onClose} backdrop="static">
      <form onSubmit={submit} style={{ display: 'contents' }} noValidate>
        <CModalHeader>
          <CModalTitle>{category ? `Edit ${category.name}` : 'New category'}</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {generalError && <CAlert color="danger">{generalError}</CAlert>}
          {errors.image && <CAlert color="danger">{errors.image}</CAlert>}
          <CRow className="g-3">
            <CCol xs={8}>
              <CFormLabel htmlFor="category-name">Name</CFormLabel>
              <CFormInput
                id="category-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                invalid={!!errors.name}
                autoFocus
              />
              <CFormFeedback invalid>{errors.name}</CFormFeedback>
            </CCol>
            <CCol xs={4}>
              <CFormLabel htmlFor="category-order">Sort order</CFormLabel>
              <CFormInput
                id="category-order"
                type="number"
                min="0"
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value)}
                invalid={!!errors.sort_order}
              />
              <CFormFeedback invalid>{errors.sort_order}</CFormFeedback>
            </CCol>
            <CCol xs={12}>
              <CFormLabel htmlFor="category-description">Description</CFormLabel>
              <CFormTextarea
                id="category-description"
                rows={2}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                invalid={!!errors.description}
              />
              <CFormFeedback invalid>{errors.description}</CFormFeedback>
            </CCol>
            <CCol xs={12}>
              <ImageField current={category?.image} file={imageFile} onFileChange={setImageFile} />
            </CCol>
            <CCol xs={12}>
              <CFormSwitch
                id="category-active"
                label="Show on kiosk"
                checked={isActive}
                onChange={(event) => setIsActive(event.target.checked)}
              />
              <CFormSwitch
                id="category-requires-size"
                label="Products need Small, Medium and Large sizes"
                checked={requiresSize}
                onChange={(event) => setRequiresSize(event.target.checked)}
              />
              <div className="form-text">
                Kiosk customers must pick a size. Combo meals in this category are exempt.
              </div>
            </CCol>
          </CRow>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" variant="ghost" onClick={onClose} disabled={save.isPending}>
            Cancel
          </CButton>
          <CButton
            type="submit"
            color="primary"
            disabled={save.isPending || (imageFile?.size ?? 0) > 4 * 1024 * 1024}
          >
            {save.isPending && <CSpinner size="sm" className="me-2" />}
            {category ? 'Save changes' : 'Create category'}
          </CButton>
        </CModalFooter>
      </form>
    </CModal>
  )
}

export default Categories
