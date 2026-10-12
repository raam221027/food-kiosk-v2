import { useMemo, useRef, useState, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  CAlert,
  CButton,
  CCol,
  CFormCheck,
  CFormFeedback,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CFormSwitch,
  CFormTextarea,
  CInputGroup,
  CInputGroupText,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CRow,
  CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus, cilTrash } from '@coreui/icons'

import ImageField from '../../components/menu/ImageField'
import type { Category, ModifierGroup, Product } from '../../domain'
import { apiErrorMessage, errorsUnder, fieldErrors } from '../../utils/apiError'
import { formatCurrency, toNumber } from '../../utils/format'
import {
  createProduct,
  deleteProductImage,
  updateProduct,
  uploadProductImage,
  type ProductInput,
} from '@/services/productService'

interface ProductFormModalProps {
  /** The product being edited, `null` for a new one. */
  product: Product | null
  categories: Category[]
  modifierGroups: ModifierGroup[]
  /** All products, for picking combo components. */
  products: Product[]
  onClose: () => void
}

/** Size and combo rows keep their inputs as strings until submit. */
interface SizeRow {
  id?: number
  name: string
  price: string
  is_available: boolean
}

interface ComboRow {
  product_id: string
  quantity: string
}

/** Must match Category::SIZES on the backend. */
const REQUIRED_SIZES = ['Small', 'Medium', 'Large']

/**
 * Exactly Small / Medium / Large, keeping the id, price and availability of
 * rows that already have those names and dropping any other sizes.
 */
const withRequiredSizes = (rows: SizeRow[], fallbackPrice: string): SizeRow[] =>
  REQUIRED_SIZES.map((name) => {
    const existing = rows.find((row) => row.name.trim().toLowerCase() === name.toLowerCase())
    return existing ? { ...existing, name } : { name, price: fallbackPrice, is_available: true }
  })

const requiresSizes = (categories: Category[], categoryId: string, isCombo: boolean) =>
  !isCombo && !!categories.find((category) => String(category.id) === categoryId)?.requires_size

const toForm = (product: Product | null, categories: Category[]) => {
  const form = baseForm(product, categories)
  return requiresSizes(categories, form.category_id, form.is_combo)
    ? { ...form, sizes: withRequiredSizes(form.sizes, form.price) }
    : form
}

const baseForm = (product: Product | null, categories: Category[]) => ({
  name: product?.name ?? '',
  category_id: String(product?.category_id ?? categories[0]?.id ?? ''),
  price: product ? String(toNumber(product.price)) : '',
  sku: product?.sku ?? '',
  description: product?.description ?? '',
  is_active: product?.is_active ?? true,
  is_available: product?.is_available ?? true,
  is_combo: product?.is_combo ?? false,
  sizes: (product?.variants ?? []).map<SizeRow>((variant) => ({
    id: variant.id,
    name: variant.name,
    price: String(toNumber(variant.price)),
    is_available: variant.is_available,
  })),
  modifier_group_ids: (product?.modifier_groups ?? []).map((group) => group.id),
  combo: (product?.combo_items ?? []).map<ComboRow>((item) => ({
    product_id: String(item.product_id),
    quantity: String(item.quantity),
  })),
})

type FormState = ReturnType<typeof toForm>

/**
 * Create / edit a product: details, image, kiosk visibility, sizes, add-ons
 * and (for combo meals) the bundled items. Keyed by the caller so the form
 * resets for every product opened.
 */
const ProductFormModal = ({
  product,
  categories,
  modifierGroups,
  products,
  onClose,
}: ProductFormModalProps) => {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<FormState>(() => toForm(product, categories))
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imageRemoved, setImageRemoved] = useState(false)
  const createdId = useRef<number | null>(null)

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }))

  const sizesRequired = requiresSizes(categories, form.category_id, form.is_combo)

  /** Category and combo changes can switch the Small / Medium / Large rule on. */
  const setSizeRule = (patch: Pick<Partial<FormState>, 'category_id' | 'is_combo' | 'combo'>) =>
    setForm((current) => {
      const next = { ...current, ...patch }
      return requiresSizes(categories, next.category_id, next.is_combo)
        ? { ...next, sizes: withRequiredSizes(next.sizes, next.price) }
        : next
    })

  // Combos are made of regular products only, and never of themselves.
  const comboCandidates = useMemo(
    () => products.filter((candidate) => !candidate.is_combo && candidate.id !== product?.id),
    [products, product?.id],
  )

  const comboValue = form.combo.reduce((total, row) => {
    const part = comboCandidates.find((candidate) => String(candidate.id) === row.product_id)
    return total + (part ? toNumber(part.price) * (Number(row.quantity) || 0) : 0)
  }, 0)

  const save = useMutation({
    mutationFn: async () => {
      const input: ProductInput = {
        category_id: Number(form.category_id),
        name: form.name.trim(),
        description: form.description.trim() || null,
        // With required sizes the listed price is the Small price.
        price: Number(sizesRequired ? form.sizes[0]?.price : form.price),
        sku: form.sku.trim() || null,
        is_active: form.is_active,
        is_available: form.is_available,
        is_combo: form.is_combo,
        variants: form.sizes.map((row) => ({
          id: row.id,
          name: row.name.trim(),
          price: Number(row.price),
          is_available: row.is_available,
        })),
        modifier_group_ids: form.modifier_group_ids,
        combo_items: form.is_combo
          ? form.combo.map((row) => ({
              product_id: Number(row.product_id),
              quantity: Number(row.quantity),
            }))
          : [],
      }

      // If a create went through but the image upload after it failed, a retry
      // must update that product rather than create a second one.
      const id = product?.id ?? createdId.current
      const saved = id ? await updateProduct(id, input) : await createProduct(input)
      createdId.current = saved.id

      if (imageFile) return uploadProductImage(saved.id, imageFile)
      if (imageRemoved && saved.image) return deleteProductImage(saved.id)
      return saved
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['manager'] })
      void queryClient.invalidateQueries({ queryKey: ['kiosk'] })
      onClose()
    },
  })

  const errors = fieldErrors(save.error)
  const sizeErrors = errorsUnder(errors, 'variants')
  const comboErrors = errorsUnder(errors, 'combo_items')
  const generalError = save.isError && Object.keys(errors).length === 0 ? apiErrorMessage(save.error) : null

  const submit = (event: FormEvent) => {
    event.preventDefault()
    save.mutate()
  }

  const updateSize = (index: number, patch: Partial<SizeRow>) =>
    set('sizes', form.sizes.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  const updateCombo = (index: number, patch: Partial<ComboRow>) =>
    set('combo', form.combo.map((row, i) => (i === index ? { ...row, ...patch } : row)))

  return (
    <CModal visible onClose={onClose} size="lg" backdrop="static" scrollable>
      {/* display: contents keeps the modal's header/body/footer flex layout (and scrolling) intact. */}
      <form onSubmit={submit} style={{ display: 'contents' }} noValidate>
        <CModalHeader>
          <CModalTitle>{product ? `Edit ${product.name}` : 'New product'}</CModalTitle>
        </CModalHeader>

        <CModalBody>
          {generalError && <CAlert color="danger">{generalError}</CAlert>}
          {errors.image && <CAlert color="danger">{errors.image}</CAlert>}
          {categories.length === 0 && (
            <CAlert color="warning">Create a category before adding products.</CAlert>
          )}

          <CRow className="g-3">
            <CCol md={8}>
              <CFormLabel htmlFor="product-name">Name</CFormLabel>
              <CFormInput
                id="product-name"
                value={form.name}
                onChange={(event) => set('name', event.target.value)}
                invalid={!!errors.name}
                required
                autoFocus
              />
              <CFormFeedback invalid>{errors.name}</CFormFeedback>
            </CCol>
            <CCol md={4}>
              <CFormLabel htmlFor="product-category">Category</CFormLabel>
              <CFormSelect
                id="product-category"
                value={form.category_id}
                onChange={(event) => setSizeRule({ category_id: event.target.value })}
                invalid={!!errors.category_id}
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                    {category.is_active ? '' : ' (inactive)'}
                  </option>
                ))}
              </CFormSelect>
              <CFormFeedback invalid>{errors.category_id}</CFormFeedback>
            </CCol>

            {!sizesRequired && (
              <CCol md={4}>
                <CFormLabel htmlFor="product-price">
                  {form.sizes.length ? 'Base price' : 'Price'}
                </CFormLabel>
                <CInputGroup className={errors.price ? 'has-validation' : undefined}>
                  <CInputGroupText>$</CInputGroupText>
                  <CFormInput
                    id="product-price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(event) => set('price', event.target.value)}
                    invalid={!!errors.price}
                    required
                  />
                  <CFormFeedback invalid>{errors.price}</CFormFeedback>
                </CInputGroup>
              </CCol>
            )}
            <CCol md={sizesRequired ? 8 : 4}>
              <CFormLabel htmlFor="product-sku">SKU</CFormLabel>
              <CFormInput
                id="product-sku"
                value={form.sku}
                placeholder="Auto-generated"
                onChange={(event) => set('sku', event.target.value)}
                invalid={!!errors.sku}
              />
              <CFormFeedback invalid>{errors.sku}</CFormFeedback>
            </CCol>
            <CCol md={4} className="d-flex flex-column justify-content-end gap-1">
              <CFormSwitch
                id="product-active"
                label="Show on kiosk"
                checked={form.is_active}
                onChange={(event) => set('is_active', event.target.checked)}
              />
              <CFormSwitch
                id="product-sold-out"
                label="Sold out"
                checked={!form.is_available}
                onChange={(event) => set('is_available', !event.target.checked)}
              />
            </CCol>

            <CCol xs={12}>
              <CFormLabel htmlFor="product-description">Description</CFormLabel>
              <CFormTextarea
                id="product-description"
                rows={2}
                value={form.description}
                onChange={(event) => set('description', event.target.value)}
                invalid={!!errors.description}
              />
              <CFormFeedback invalid>{errors.description}</CFormFeedback>
            </CCol>

            <CCol xs={12}>
              <ImageField
                current={product?.image}
                file={imageFile}
                removed={imageRemoved}
                onFileChange={(file) => {
                  setImageFile(file)
                  if (file) setImageRemoved(false)
                }}
                onRemove={() => setImageRemoved(true)}
              />
            </CCol>
          </CRow>

          <hr className="my-4" />

          {/* Sizes */}
          <div className="d-flex align-items-center justify-content-between mb-2">
            <div>
              <div className="fw-semibold">Sizes</div>
              <div className="small text-body-secondary">
                {sizesRequired
                  ? 'Required for this category. Set a price for each size; customers must pick one.'
                  : 'Optional. Each size has its own price, e.g. Small / Medium / Large.'}
              </div>
            </div>
            {!sizesRequired && (
              <CButton
                color="primary"
                variant="outline"
                size="sm"
                onClick={() =>
                  set('sizes', [...form.sizes, { name: '', price: form.price, is_available: true }])
                }
              >
                <CIcon icon={cilPlus} className="me-1" />
                Add size
              </CButton>
            )}
          </div>
          {form.sizes.map((row, index) => (
            <CRow key={row.id ?? `new-${index}`} className="g-2 align-items-center mb-2">
              <CCol xs={5}>
                <CFormInput
                  aria-label="Size name"
                  placeholder="Size name"
                  value={row.name}
                  onChange={(event) => updateSize(index, { name: event.target.value })}
                  invalid={!!errors[`variants.${index}.name`]}
                  readOnly={sizesRequired}
                  plainText={sizesRequired}
                  className={sizesRequired ? 'fw-semibold' : undefined}
                />
              </CCol>
              <CCol xs={3}>
                <CInputGroup>
                  <CInputGroupText>$</CInputGroupText>
                  <CFormInput
                    aria-label="Size price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={row.price}
                    onChange={(event) => updateSize(index, { price: event.target.value })}
                    invalid={!!errors[`variants.${index}.price`]}
                  />
                </CInputGroup>
              </CCol>
              <CCol xs={3}>
                <CFormSwitch
                  id={`size-available-${index}`}
                  label="Available"
                  checked={row.is_available}
                  onChange={(event) => updateSize(index, { is_available: event.target.checked })}
                />
              </CCol>
              <CCol xs={1} className="text-end">
                {!sizesRequired && (
                  <CButton
                    color="danger"
                    variant="ghost"
                    size="sm"
                    aria-label="Remove size"
                    onClick={() => set('sizes', form.sizes.filter((_, i) => i !== index))}
                  >
                    <CIcon icon={cilTrash} />
                  </CButton>
                )}
              </CCol>
            </CRow>
          ))}
          {sizeErrors.length > 0 && <div className="small text-danger">{sizeErrors[0]}</div>}

          <hr className="my-4" />

          {/* Add-ons */}
          <div className="fw-semibold">Add-ons</div>
          <div className="small text-body-secondary mb-2">
            Add-on groups customers can pick from with this item. Manage them on the Add-ons page.
          </div>
          {modifierGroups.length === 0 ? (
            <div className="small text-body-secondary fst-italic">No add-on groups yet.</div>
          ) : (
            <CRow className="g-2">
              {modifierGroups.map((group) => (
                <CCol key={group.id} sm={6}>
                  <CFormCheck
                    id={`group-${group.id}`}
                    label={`${group.name} (${group.modifiers?.length ?? 0} options)`}
                    checked={form.modifier_group_ids.includes(group.id)}
                    onChange={(event) =>
                      set(
                        'modifier_group_ids',
                        event.target.checked
                          ? [...form.modifier_group_ids, group.id]
                          : form.modifier_group_ids.filter((id) => id !== group.id),
                      )
                    }
                  />
                </CCol>
              ))}
            </CRow>
          )}

          <hr className="my-4" />

          {/* Combo */}
          <CFormSwitch
            id="product-combo"
            label={<span className="fw-semibold">This is a combo meal</span>}
            checked={form.is_combo}
            invalid={!!errors.is_combo}
            onChange={(event) =>
              setSizeRule({
                is_combo: event.target.checked,
                combo:
                  event.target.checked && form.combo.length === 0
                    ? [{ product_id: '', quantity: '1' }]
                    : form.combo,
              })
            }
          />
          {errors.is_combo && <div className="small text-danger">{errors.is_combo}</div>}

          {form.is_combo && (
            <div className="mt-3">
              {form.combo.map((row, index) => (
                <CRow key={index} className="g-2 align-items-center mb-2">
                  <CCol xs={8}>
                    <CFormSelect
                      aria-label="Combo item"
                      value={row.product_id}
                      onChange={(event) => updateCombo(index, { product_id: event.target.value })}
                      invalid={!!errors[`combo_items.${index}.product_id`]}
                    >
                      <option value="">Choose a product…</option>
                      {comboCandidates.map((candidate) => (
                        <option key={candidate.id} value={candidate.id}>
                          {candidate.name} — {formatCurrency(candidate.price)}
                        </option>
                      ))}
                    </CFormSelect>
                  </CCol>
                  <CCol xs={3}>
                    <CInputGroup>
                      <CInputGroupText>×</CInputGroupText>
                      <CFormInput
                        aria-label="Quantity"
                        type="number"
                        min="1"
                        max="20"
                        value={row.quantity}
                        onChange={(event) => updateCombo(index, { quantity: event.target.value })}
                      />
                    </CInputGroup>
                  </CCol>
                  <CCol xs={1} className="text-end">
                    <CButton
                      color="danger"
                      variant="ghost"
                      size="sm"
                      aria-label="Remove combo item"
                      onClick={() => set('combo', form.combo.filter((_, i) => i !== index))}
                    >
                      <CIcon icon={cilTrash} />
                    </CButton>
                  </CCol>
                </CRow>
              ))}
              {comboErrors.length > 0 && <div className="small text-danger mb-2">{comboErrors[0]}</div>}
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
                <CButton
                  color="primary"
                  variant="outline"
                  size="sm"
                  onClick={() => set('combo', [...form.combo, { product_id: '', quantity: '1' }])}
                >
                  <CIcon icon={cilPlus} className="me-1" />
                  Add item
                </CButton>
                {comboValue > 0 && (
                  <span className="small text-body-secondary">
                    Items bought separately: {formatCurrency(comboValue)}
                    {Number(form.price) > 0 && Number(form.price) < comboValue && (
                      <span className="text-success fw-semibold ms-2">
                        Customers save {formatCurrency(comboValue - Number(form.price))}
                      </span>
                    )}
                  </span>
                )}
              </div>
            </div>
          )}
        </CModalBody>

        <CModalFooter>
          <CButton color="secondary" variant="ghost" onClick={onClose} disabled={save.isPending}>
            Cancel
          </CButton>
          <CButton
            type="submit"
            color="primary"
            disabled={save.isPending || categories.length === 0 || (imageFile?.size ?? 0) > 4 * 1024 * 1024}
          >
            {save.isPending && <CSpinner size="sm" className="me-2" />}
            {product ? 'Save changes' : 'Create product'}
          </CButton>
        </CModalFooter>
      </form>
    </CModal>
  )
}

export default ProductFormModal
