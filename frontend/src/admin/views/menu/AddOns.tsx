import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  CAlert,
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CFormFeedback,
  CFormInput,
  CFormLabel,
  CFormSwitch,
  CInputGroup,
  CInputGroupText,
  CListGroup,
  CListGroupItem,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CRow,
  CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPencil, cilPlus, cilTrash } from '@coreui/icons'

import { EmptyState, PageHeader } from '../../components/common'
import type { ModifierGroup } from '../../domain'
import { apiErrorMessage, errorsUnder, fieldErrors } from '../../utils/apiError'
import { formatCurrency, toNumber } from '../../utils/format'
import {
  createModifierGroup,
  deleteModifierGroup,
  getModifierGroups,
  updateModifierGroup,
  type ModifierGroupInput,
} from '@/services/modifierService'

/** "Pick up to 3", "Pick 1", "Pick 1 to 2", "Optional". */
const selectionRule = (group: ModifierGroup) => {
  const { min_selection: min, max_selection: max } = group
  if (max === 0) return min > 0 ? `Pick at least ${min}` : 'Pick any'
  if (min === max) return `Pick ${min}`
  return min > 0 ? `Pick ${min} to ${max}` : `Pick up to ${max}`
}

/**
 * Add-on groups (extra toppings, sauces, ...) and the add-ons in each. Groups
 * are attached to products from the product form.
 */
const AddOns = () => {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<ModifierGroup | 'new' | null>(null)

  const groups = useQuery({ queryKey: ['manager', 'modifier-groups'], queryFn: getModifierGroups })
  const list = groups.data ?? []

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['manager'] })
    void queryClient.invalidateQueries({ queryKey: ['kiosk'] })
  }

  const remove = useMutation({ mutationFn: deleteModifierGroup, onSuccess: refresh })

  const confirmDelete = (group: ModifierGroup) => {
    const usage = group.products_count
      ? ` It is offered on ${group.products_count} product(s) and will be removed from them.`
      : ''
    if (window.confirm(`Delete "${group.name}"?${usage}`)) remove.mutate(group.id)
  }

  return (
    <>
      <PageHeader
        title="Add-ons"
        subtitle="Extras customers can add to an item, grouped with selection limits."
        actions={
          <CButton color="primary" onClick={() => setEditing('new')}>
            <CIcon icon={cilPlus} className="me-1" />
            New add-on group
          </CButton>
        }
      />

      {groups.isError && (
        <CAlert color="danger">Could not load add-ons: {apiErrorMessage(groups.error)}</CAlert>
      )}
      {remove.isError && (
        <CAlert color="danger" dismissible onClose={() => remove.reset()}>
          {apiErrorMessage(remove.error)}
        </CAlert>
      )}

      {groups.isLoading ? (
        <div className="text-center py-5">
          <CSpinner color="primary" />
        </div>
      ) : list.length === 0 ? (
        <CCard>
          <CCardBody>
            <EmptyState title="No add-on groups yet" description="For example: Extra toppings, Sauces." />
          </CCardBody>
        </CCard>
      ) : (
        <CRow xs={{ gutter: 4 }}>
          {list.map((group) => (
            <CCol key={group.id} md={6} xl={4}>
              <CCard className="h-100">
                <CCardHeader className="d-flex align-items-center justify-content-between gap-2">
                  <div className="min-w-0">
                    <div className="fw-semibold text-truncate">{group.name}</div>
                    <div className="small text-body-secondary">
                      {selectionRule(group)}
                      {group.is_required && (
                        <CBadge color="warning" className="ms-2">
                          Required
                        </CBadge>
                      )}
                    </div>
                  </div>
                  <div className="text-nowrap">
                    <CButton
                      color="secondary"
                      variant="ghost"
                      size="sm"
                      aria-label={`Edit ${group.name}`}
                      onClick={() => setEditing(group)}
                    >
                      <CIcon icon={cilPencil} />
                    </CButton>
                    <CButton
                      color="danger"
                      variant="ghost"
                      size="sm"
                      aria-label={`Delete ${group.name}`}
                      disabled={remove.isPending}
                      onClick={() => confirmDelete(group)}
                    >
                      <CIcon icon={cilTrash} />
                    </CButton>
                  </div>
                </CCardHeader>
                <CListGroup flush>
                  {(group.modifiers ?? []).length === 0 && (
                    <CListGroupItem className="small text-body-secondary fst-italic">
                      No add-ons in this group.
                    </CListGroupItem>
                  )}
                  {(group.modifiers ?? []).map((modifier) => (
                    <CListGroupItem
                      key={modifier.id}
                      className={`d-flex justify-content-between ${modifier.is_available ? '' : 'text-body-secondary'}`}
                    >
                      <span>
                        {modifier.name}
                        {!modifier.is_available && (
                          <CBadge color="secondary" className="ms-2">
                            Unavailable
                          </CBadge>
                        )}
                      </span>
                      <span className="fw-semibold">
                        {toNumber(modifier.price) > 0 ? `+${formatCurrency(modifier.price)}` : 'Free'}
                      </span>
                    </CListGroupItem>
                  ))}
                </CListGroup>
                <div className="card-footer small text-body-secondary">
                  Offered on {group.products_count ?? 0} product(s)
                </div>
              </CCard>
            </CCol>
          ))}
        </CRow>
      )}

      {editing !== null && (
        <AddOnGroupModal
          key={editing === 'new' ? 'new' : editing.id}
          group={editing === 'new' ? null : editing}
          onSaved={refresh}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  )
}

interface AddOnRow {
  id?: number
  name: string
  price: string
  is_available: boolean
}

interface AddOnGroupModalProps {
  group: ModifierGroup | null
  onSaved: () => void
  onClose: () => void
}

const AddOnGroupModal = ({ group, onSaved, onClose }: AddOnGroupModalProps) => {
  const [name, setName] = useState(group?.name ?? '')
  const [min, setMin] = useState(String(group?.min_selection ?? 0))
  const [max, setMax] = useState(String(group?.max_selection ?? 0))
  const [isRequired, setIsRequired] = useState(group?.is_required ?? false)
  const [rows, setRows] = useState<AddOnRow[]>(() =>
    group?.modifiers?.length
      ? group.modifiers.map((modifier) => ({
          id: modifier.id,
          name: modifier.name,
          price: String(toNumber(modifier.price)),
          is_available: modifier.is_available,
        }))
      : [{ name: '', price: '0', is_available: true }],
  )

  const save = useMutation({
    mutationFn: () => {
      const input: ModifierGroupInput = {
        name: name.trim(),
        min_selection: Number(min) || 0,
        max_selection: Number(max) || 0,
        is_required: isRequired,
        // Blank rows are the empty starter line; skip them rather than fail.
        modifiers: rows
          .filter((row) => row.id || row.name.trim())
          .map((row) => ({
            id: row.id,
            name: row.name.trim(),
            price: Number(row.price) || 0,
            is_available: row.is_available,
          })),
      }
      return group ? updateModifierGroup(group.id, input) : createModifierGroup(input)
    },
    onSuccess: () => {
      onSaved()
      onClose()
    },
  })

  const errors = fieldErrors(save.error)
  const rowErrors = errorsUnder(errors, 'modifiers')
  const generalError = save.isError && Object.keys(errors).length === 0 ? apiErrorMessage(save.error) : null

  const updateRow = (index: number, patch: Partial<AddOnRow>) =>
    setRows((current) => current.map((row, i) => (i === index ? { ...row, ...patch } : row)))

  const submit = (event: FormEvent) => {
    event.preventDefault()
    save.mutate()
  }

  return (
    <CModal visible onClose={onClose} size="lg" backdrop="static" scrollable>
      <form onSubmit={submit} style={{ display: 'contents' }} noValidate>
        <CModalHeader>
          <CModalTitle>{group ? `Edit ${group.name}` : 'New add-on group'}</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {generalError && <CAlert color="danger">{generalError}</CAlert>}
          <CRow className="g-3">
            <CCol md={6}>
              <CFormLabel htmlFor="group-name">Group name</CFormLabel>
              <CFormInput
                id="group-name"
                placeholder="e.g. Extra toppings"
                value={name}
                onChange={(event) => setName(event.target.value)}
                invalid={!!errors.name}
                autoFocus
              />
              <CFormFeedback invalid>{errors.name}</CFormFeedback>
            </CCol>
            <CCol xs={6} md={3}>
              <CFormLabel htmlFor="group-min">Minimum picks</CFormLabel>
              <CFormInput
                id="group-min"
                type="number"
                min="0"
                value={min}
                onChange={(event) => setMin(event.target.value)}
                invalid={!!errors.min_selection}
              />
              <CFormFeedback invalid>{errors.min_selection}</CFormFeedback>
            </CCol>
            <CCol xs={6} md={3}>
              <CFormLabel htmlFor="group-max">Maximum picks</CFormLabel>
              <CFormInput
                id="group-max"
                type="number"
                min="0"
                value={max}
                onChange={(event) => setMax(event.target.value)}
                invalid={!!errors.max_selection}
              />
              <CFormFeedback invalid>{errors.max_selection ?? ''}</CFormFeedback>
              {!errors.max_selection && <div className="form-text">0 = no limit</div>}
            </CCol>
            <CCol xs={12}>
              <CFormSwitch
                id="group-required"
                label="Customers must choose from this group"
                checked={isRequired}
                onChange={(event) => setIsRequired(event.target.checked)}
              />
            </CCol>
          </CRow>

          <hr className="my-4" />

          <div className="fw-semibold mb-2">Add-ons</div>
          {rows.map((row, index) => (
            <CRow key={row.id ?? `new-${index}`} className="g-2 align-items-center mb-2">
              <CCol xs={5}>
                <CFormInput
                  aria-label="Add-on name"
                  placeholder="e.g. Bacon"
                  value={row.name}
                  onChange={(event) => updateRow(index, { name: event.target.value })}
                />
              </CCol>
              <CCol xs={3}>
                <CInputGroup>
                  <CInputGroupText>+$</CInputGroupText>
                  <CFormInput
                    aria-label="Add-on price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={row.price}
                    onChange={(event) => updateRow(index, { price: event.target.value })}
                  />
                </CInputGroup>
              </CCol>
              <CCol xs={3}>
                <CFormSwitch
                  id={`addon-available-${index}`}
                  label="Available"
                  checked={row.is_available}
                  onChange={(event) => updateRow(index, { is_available: event.target.checked })}
                />
              </CCol>
              <CCol xs={1} className="text-end">
                <CButton
                  color="danger"
                  variant="ghost"
                  size="sm"
                  aria-label="Remove add-on"
                  onClick={() => setRows((current) => current.filter((_, i) => i !== index))}
                >
                  <CIcon icon={cilTrash} />
                </CButton>
              </CCol>
            </CRow>
          ))}
          {rowErrors.length > 0 && <div className="small text-danger mb-2">{rowErrors[0]}</div>}
          <CButton
            color="primary"
            variant="outline"
            size="sm"
            onClick={() => setRows((current) => [...current, { name: '', price: '0', is_available: true }])}
          >
            <CIcon icon={cilPlus} className="me-1" />
            Add add-on
          </CButton>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" variant="ghost" onClick={onClose} disabled={save.isPending}>
            Cancel
          </CButton>
          <CButton type="submit" color="primary" disabled={save.isPending}>
            {save.isPending && <CSpinner size="sm" className="me-2" />}
            {group ? 'Save changes' : 'Create group'}
          </CButton>
        </CModalFooter>
      </form>
    </CModal>
  )
}

export default AddOns
