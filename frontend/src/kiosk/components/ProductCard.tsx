import { Plus } from 'lucide-react'

import type { Product } from '@/admin/domain'
import { formatCurrency, toNumber } from '@/admin/utils/format'
import { cn } from '@/lib/utils'
import { isSoldOut, sizesOf } from '../useOrder'
import FoodArt from './FoodArt'

interface ProductCardProps {
  product: Product
  categoryName?: string
  /** How many of this item are already in the order, shown as a badge. */
  inOrder: number
  onSelect: (product: Product) => void
}

/** One tile in the menu grid. Sold-out items stay visible but cannot be picked. */
const ProductCard = ({ product, categoryName, inOrder, onSelect }: ProductCardProps) => {
  const soldOut = isSoldOut(product)
  const sizes = sizesOf(product)
  // With sizes, show the cheapest one as a "from" price.
  const fromPrice = sizes.length ? Math.min(...sizes.map((size) => toNumber(size.price))) : null

  return (
    <button
      type="button"
      disabled={soldOut}
      onClick={() => onSelect(product)}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-3xl bg-white text-left shadow-sm ring-1 ring-grill/5',
        'transition active:scale-[0.97] active:shadow-none disabled:active:scale-100',
      )}
    >
      <FoodArt
        name={product.name}
        categoryName={categoryName}
        image={product.image}
        className={cn('aspect-[4/3] w-full', soldOut && 'opacity-40 grayscale')}
      />

      {inOrder > 0 && (
        <span className="absolute top-3 right-3 flex size-10 items-center justify-center rounded-full bg-ketchup text-lg font-extrabold text-white shadow-md">
          {inOrder}
        </span>
      )}
      {soldOut && (
        <span className="absolute top-3 left-3 rounded-full bg-grill px-3 py-1 text-sm font-bold text-white">
          Sold out
        </span>
      )}

      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className={cn('text-lg leading-tight font-extrabold text-balance md:text-xl', soldOut && 'text-grill/40')}>
          {product.name}
        </h3>
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <span className={cn('text-xl font-black text-ketchup', soldOut && 'text-grill/30')}>
            {fromPrice !== null && <span className="mr-1 text-sm font-bold text-grill/50">from</span>}
            {formatCurrency(fromPrice ?? product.price)}
          </span>
          {!soldOut && (
            <span className="flex size-11 items-center justify-center rounded-full bg-mustard text-grill transition group-active:bg-mustard-dark">
              <Plus className="size-6" strokeWidth={2.75} />
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

export default ProductCard
