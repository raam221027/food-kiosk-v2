import { create } from 'zustand'

import type { Product, ProductVariant } from '@/admin/domain'
import { toNumber } from '@/admin/utils/format'

/** Matches the `order_type` enum on the orders table. */
export type OrderType = 'dine-in' | 'take-out'

export interface OrderLine {
  /** Product and size together: a Small and a Large Cola are separate lines. */
  key: string
  product: Product
  /** The chosen size, or `null` for products without sizes. */
  variant: ProductVariant | null
  quantity: number
}

export interface PlacedOrder {
  number: string
  type: OrderType
  total: number
  /** True when the API refused the order and the number was made up locally. */
  isDemo: boolean
}

interface OrderState {
  orderType: OrderType | null
  lines: OrderLine[]
  placed: PlacedOrder | null
  setOrderType: (type: OrderType) => void
  /** Adds to an existing line for the same product and size instead of duplicating it. */
  add: (product: Product, variant: ProductVariant | null, quantity: number) => void
  /** A quantity of 0 removes the line. */
  setQuantity: (key: string, quantity: number) => void
  complete: (order: PlacedOrder) => void
  /** Back to a blank order, as if a new customer walked up. */
  reset: () => void
}

export const MAX_QUANTITY = 20

const clamp = (quantity: number) => Math.min(MAX_QUANTITY, Math.max(0, quantity))

const lineKey = (product: Product, variant: ProductVariant | null) =>
  `${product.id}:${variant?.id ?? 0}`

export const useOrder = create<OrderState>()((set) => ({
  orderType: null,
  lines: [],
  placed: null,

  setOrderType: (orderType) => set({ orderType }),

  add: (product, variant, quantity) =>
    set((state) => {
      const key = lineKey(product, variant)
      const existing = state.lines.find((line) => line.key === key)
      if (existing) {
        return {
          lines: state.lines.map((line) =>
            line === existing ? { ...line, quantity: clamp(line.quantity + quantity) } : line,
          ),
        }
      }
      return { lines: [...state.lines, { key, product, variant, quantity: clamp(quantity) }] }
    }),

  setQuantity: (key, quantity) =>
    set((state) => ({
      lines: state.lines
        .map((line) => (line.key === key ? { ...line, quantity: clamp(quantity) } : line))
        .filter((line) => line.quantity > 0),
    })),

  complete: (placed) => set({ placed, lines: [], orderType: null }),

  reset: () => set({ orderType: null, lines: [], placed: null }),
}))

export const countItems = (lines: OrderLine[]) =>
  lines.reduce((sum, line) => sum + line.quantity, 0)

/** The price of one item on the line: the size's price when a size was chosen. */
export const unitPrice = (line: OrderLine) => toNumber(line.variant?.price ?? line.product.price)

export const lineTotal = (line: OrderLine) => unitPrice(line) * line.quantity

export const subtotalOf = (lines: OrderLine[]) =>
  lines.reduce((sum, line) => sum + lineTotal(line), 0)

/** Rounds to cents so the totals shown match what is sent to the API. */
export const roundMoney = (value: number) => Math.round(value * 100) / 100

/** Sizes a customer can pick for the product (the kiosk API sends only available ones). */
export const sizesOf = (product: Product) => product.variants ?? []

/**
 * Sold out when out of stock, or when the category requires a size and none
 * is currently available.
 */
export const isSoldOut = (product: Product) =>
  !product.is_available || (!!product.category?.requires_size && !product.is_combo && sizesOf(product).length === 0)
