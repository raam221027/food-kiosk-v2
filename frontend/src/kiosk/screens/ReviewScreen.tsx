import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { ArrowLeft, LoaderCircle } from 'lucide-react'

import { formatCurrency } from '@/admin/utils/format'
import { createOrder, type NewOrder } from '@/services/orderService'
import FoodArt from '../components/FoodArt'
import QuantityStepper from '../components/QuantityStepper'
import { useMenu } from '../useMenu'
import { countItems, lineTotal, roundMoney, subtotalOf, unitPrice, useOrder } from '../useOrder'

/** Reads the order number from either a bare model or an API Resource (`{ data }`). */
const orderNumberFrom = (payload: unknown): string | null => {
  const record = payload as { order_number?: unknown; data?: { order_number?: unknown } } | null
  const value = record?.order_number ?? record?.data?.order_number
  return value === undefined || value === null ? null : String(value)
}

/** A short number to call out at the counter when the API did not supply one. */
const localOrderNumber = () => String(Math.floor(100 + Math.random() * 900))

/** "Is this everything?" — edit quantities, see the total, place the order. */
const ReviewScreen = () => {
  const navigate = useNavigate()
  const { restaurantId, categories, taxRate } = useMenu()
  const orderType = useOrder((state) => state.orderType)
  const lines = useOrder((state) => state.lines)
  const setQuantity = useOrder((state) => state.setQuantity)
  const complete = useOrder((state) => state.complete)
  const [submitting, setSubmitting] = useState(false)

  if (!orderType) return <Navigate to="/order" replace />

  const categoryName = (categoryId: number) =>
    categories.find((category) => category.id === categoryId)?.name
  const subtotal = roundMoney(subtotalOf(lines))
  const tax = roundMoney(subtotal * taxRate)
  const total = roundMoney(subtotal + tax)

  const placeOrder = async () => {
    setSubmitting(true)
    const order: NewOrder = {
      restaurant_id: restaurantId,
      order_type: orderType,
      customer_name: 'Kiosk customer',
      subtotal,
      tax,
      total_amount: total,
      items: lines.map((line) => ({
        product_id: line.product.id,
        variant_id: line.variant?.id ?? null,
        product_name: line.variant ? `${line.product.name} (${line.variant.name})` : line.product.name,
        quantity: line.quantity,
        price: unitPrice(line),
        total_price: roundMoney(lineTotal(line)),
      })),
    }

    // POST /orders does not exist on the backend yet. Rather than strand the
    // customer, hand out a local number and flag the order as a demo so the
    // confirmation screen can say it never reached the kitchen.
    let number: string | null = null
    let isDemo = false
    try {
      number = orderNumberFrom(await createOrder(order))
    } catch {
      isDemo = true
    }

    complete({ number: number ?? localOrderNumber(), type: orderType, total, isDemo })
    navigate('/order/complete', { replace: true })
  }

  return (
    <div className="flex h-svh flex-col bg-bun text-grill">
      <header className="flex items-center gap-3 bg-ketchup px-4 py-4 text-white md:px-6">
        <button
          type="button"
          onClick={() => navigate('/order/menu')}
          aria-label="Back to menu"
          className="flex size-12 items-center justify-center rounded-full bg-white/15 active:bg-white/25"
        >
          <ArrowLeft className="size-6" />
        </button>
        <h1 className="text-3xl font-black tracking-tight md:text-4xl">Review your order</h1>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto px-4 py-6 md:px-8">
        <div className="mx-auto max-w-3xl">
          {lines.length === 0 ? (
            <div className="py-24 text-center">
              <p className="text-2xl font-bold text-grill/60">Your order is empty.</p>
              <button
                type="button"
                onClick={() => navigate('/order/menu')}
                className="mt-6 rounded-2xl bg-mustard px-8 py-4 text-xl font-extrabold"
              >
                Browse the menu
              </button>
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {lines.map((line) => (
                <li
                  key={line.key}
                  className="flex flex-wrap items-center gap-4 rounded-3xl bg-white p-3 pr-5 shadow-sm md:flex-nowrap"
                >
                  <FoodArt
                    name={line.product.name}
                    categoryName={categoryName(line.product.category_id)}
                    image={line.product.image}
                    className="size-20 shrink-0 rounded-2xl md:size-24"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xl font-extrabold leading-tight">
                      {line.variant && <span className="text-ketchup">{line.variant.name} </span>}
                      {line.product.name}
                    </p>
                    <p className="text-base text-grill/60">
                      {formatCurrency(unitPrice(line))} each
                    </p>
                  </div>
                  <div className="flex w-full items-center justify-between gap-6 md:w-auto">
                    <QuantityStepper
                      value={line.quantity}
                      min={0}
                      onChange={(quantity) => setQuantity(line.key, quantity)}
                    />
                    <span className="min-w-[5.5rem] text-right text-xl font-black tabular-nums">
                      {formatCurrency(lineTotal(line))}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>

      {lines.length > 0 && (
        <footer className="border-t border-grill/10 bg-white px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:px-8">
          <div className="mx-auto flex max-w-3xl flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <dl className="grid grid-cols-[auto_auto] gap-x-8 gap-y-1 text-lg tabular-nums">
              <dt className="text-grill/60">
                Subtotal ({countItems(lines)} {countItems(lines) === 1 ? 'item' : 'items'})
              </dt>
              <dd className="text-right font-semibold">{formatCurrency(subtotal)}</dd>
              <dt className="text-grill/60">Tax ({(taxRate * 100).toFixed(2)}%)</dt>
              <dd className="text-right font-semibold">{formatCurrency(tax)}</dd>
              <dt className="text-2xl font-black">Total</dt>
              <dd className="text-right text-2xl font-black">{formatCurrency(total)}</dd>
            </dl>
            <button
              type="button"
              disabled={submitting}
              onClick={placeOrder}
              className="flex items-center justify-center gap-3 rounded-2xl bg-ketchup px-10 py-5 text-2xl font-extrabold text-white shadow-[0_6px_0_var(--color-ketchup-dark)] transition active:translate-y-1 active:shadow-[0_2px_0_var(--color-ketchup-dark)] disabled:opacity-70"
            >
              {submitting && <LoaderCircle className="size-6 animate-spin" />}
              {submitting ? 'Placing order…' : 'Place order'}
            </button>
          </div>
        </footer>
      )}
    </div>
  )
}

export default ReviewScreen
