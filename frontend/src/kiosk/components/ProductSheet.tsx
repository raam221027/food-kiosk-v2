import { useState } from 'react'
import { Check, X } from 'lucide-react'

import type { Product, ProductVariant } from '@/admin/domain'
import { formatCurrency, toNumber } from '@/admin/utils/format'
import { cn } from '@/lib/utils'
import { sizesOf } from '../useOrder'
import FoodArt from './FoodArt'
import KioskModal from './KioskModal'
import QuantityStepper from './QuantityStepper'

interface ProductSheetProps {
  product: Product | null
  categoryName?: string
  onClose: () => void
  onAdd: (product: Product, variant: ProductVariant | null, quantity: number) => void
}

/** Item detail: big picture, description, size, quantity, "Add to order". */
const ProductSheet = ({ product, categoryName, onClose, onAdd }: ProductSheetProps) => (
  <KioskModal open={product !== null} onClose={onClose}>
    {/* Keyed so the size and quantity reset for every item opened. */}
    {product && (
      <ProductSheetBody
        key={product.id}
        product={product}
        categoryName={categoryName}
        onClose={onClose}
        onAdd={onAdd}
      />
    )}
  </KioskModal>
)

const ProductSheetBody = ({
  product,
  categoryName,
  onClose,
  onAdd,
}: ProductSheetProps & { product: Product }) => {
  const [quantity, setQuantity] = useState(1)
  const sizes = sizesOf(product)
  // A product with sizes needs one picked before it can be added.
  const [size, setSize] = useState<ProductVariant | null>(null)
  const needsSize = sizes.length > 0 && size === null
  const price = toNumber(size?.price ?? product.price)
  const fromPrice = sizes.length ? Math.min(...sizes.map((option) => toNumber(option.price))) : price

  return (
    <>
      <div className="relative">
        <FoodArt
          name={product.name}
          categoryName={categoryName}
          image={product.image}
          className="aspect-[16/10] w-full"
        />
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 flex size-12 items-center justify-center rounded-full bg-white/90 text-grill shadow active:scale-90"
        >
          <X className="size-6" />
        </button>
      </div>

      <div className="flex flex-col gap-6 p-6 md:p-8">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-grill md:text-4xl">{product.name}</h2>
          {product.description && (
            <p className="mt-2 text-lg text-grill/65">{product.description}</p>
          )}
          <p className="mt-3 text-2xl font-black text-ketchup">
            {needsSize && <span className="mr-1.5 text-lg font-bold text-grill/50">from</span>}
            {formatCurrency(needsSize ? fromPrice : price)}
          </p>
        </div>

        {sizes.length > 0 && (
          <fieldset>
            <legend className="mb-3 flex items-center gap-2 text-xl font-extrabold text-grill">
              Choose a size
              <span className="rounded-full bg-mustard px-2.5 py-0.5 text-sm font-bold">Required</span>
            </legend>
            <div className="grid grid-cols-3 gap-3">
              {sizes.map((option) => {
                const selected = size?.id === option.id
                return (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setSize(option)}
                    className={cn(
                      'relative flex flex-col items-center gap-1 rounded-2xl border-3 bg-white px-3 py-4 transition active:scale-95',
                      selected ? 'border-ketchup bg-ketchup/5' : 'border-grill/10',
                    )}
                  >
                    {selected && (
                      <span className="absolute top-2 right-2 flex size-6 items-center justify-center rounded-full bg-ketchup text-white">
                        <Check className="size-4" strokeWidth={3} />
                      </span>
                    )}
                    <span className="text-xl font-extrabold text-grill">{option.name}</span>
                    <span className="text-lg font-bold text-grill/60">{formatCurrency(option.price)}</span>
                  </button>
                )
              })}
            </div>
          </fieldset>
        )}

        <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex justify-center">
            <QuantityStepper value={quantity} onChange={setQuantity} size="lg" />
          </div>
          <button
            type="button"
            disabled={needsSize}
            onClick={() => onAdd(product, size, quantity)}
            className="rounded-2xl bg-ketchup px-8 py-5 text-xl font-extrabold text-white shadow-[0_6px_0_var(--color-ketchup-dark)] transition active:translate-y-1 active:shadow-[0_2px_0_var(--color-ketchup-dark)] disabled:translate-y-0 disabled:bg-grill/25 disabled:shadow-none"
          >
            {needsSize ? 'Choose a size' : <>Add to order &middot; {formatCurrency(price * quantity)}</>}
          </button>
        </div>
      </div>
    </>
  )
}

export default ProductSheet
