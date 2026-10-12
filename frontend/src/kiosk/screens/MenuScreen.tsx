import { useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { ChevronRight, RotateCcw, ShoppingBag, Utensils } from 'lucide-react'

import type { Product } from '@/admin/domain'
import { formatCurrency } from '@/admin/utils/format'
import { cn } from '@/lib/utils'
import { iconFor } from '../foodIcons'
import ProductCard from '../components/ProductCard'
import ProductSheet from '../components/ProductSheet'
import StartOverDialog from '../components/StartOverDialog'
import { useMenu } from '../useMenu'
import { countItems, subtotalOf, useOrder } from '../useOrder'

/** Category rail + food card grid + running order bar. */
const MenuScreen = () => {
  const navigate = useNavigate()
  const { restaurantName, categories, products, isLoading } = useMenu()
  const orderType = useOrder((state) => state.orderType)
  const lines = useOrder((state) => state.lines)
  const add = useOrder((state) => state.add)
  const reset = useOrder((state) => state.reset)

  const [pickedCategoryId, setPickedCategoryId] = useState<number | null>(null)
  const [selected, setSelected] = useState<Product | null>(null)
  const [confirmingReset, setConfirmingReset] = useState(false)

  // Falls back to the first category until the customer picks one, which also
  // covers the menu arriving after the first render.
  const activeCategory =
    categories.find((category) => category.id === pickedCategoryId) ?? categories[0]

  const categoryNames = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  )
  const visibleProducts = products.filter((product) => product.category_id === activeCategory?.id)
  const quantityOf = (productId: number) =>
    lines
      .filter((line) => line.product.id === productId)
      .reduce((sum, line) => sum + line.quantity, 0)

  const itemCount = countItems(lines)

  if (!orderType) return <Navigate to="/order" replace />

  const startOver = () => {
    reset()
    navigate('/', { replace: true })
  }

  return (
    <div className="flex h-svh flex-col bg-bun text-grill">
      {/* Header */}
      <header className="flex items-center justify-between gap-3 bg-ketchup px-4 py-3 text-white md:px-6">
        <span className="truncate text-2xl font-black tracking-tight md:text-3xl">{restaurantName}</span>
        <button
          type="button"
          onClick={() => navigate('/order')}
          className="flex shrink-0 items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-base font-bold active:bg-white/25 md:text-lg"
        >
          {orderType === 'dine-in' ? <Utensils className="size-5" /> : <ShoppingBag className="size-5" />}
          {orderType === 'dine-in' ? 'Eat In' : 'Take Out'}
        </button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        {/* Category rail: a row of chips on narrow screens, a column beside the grid on wide ones. */}
        <nav
          aria-label="Menu categories"
          className="flex shrink-0 gap-2 overflow-x-auto bg-white px-3 py-3 shadow-sm md:w-44 md:flex-col md:overflow-x-visible md:overflow-y-auto md:px-3 md:py-4 lg:w-52"
        >
          {categories.map((category) => {
            const Icon = iconFor(category.name)
            const active = category.id === activeCategory?.id
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => setPickedCategoryId(category.id)}
                aria-current={active ? 'true' : undefined}
                className={cn(
                  'flex shrink-0 items-center gap-2 rounded-2xl px-4 py-3 text-left text-base font-bold transition md:flex-col md:gap-2 md:px-2 md:py-4 md:text-center md:text-lg',
                  active ? 'bg-mustard text-grill shadow-sm' : 'text-grill/70 active:bg-grill/5',
                )}
              >
                <span
                  className={cn(
                    'flex size-10 items-center justify-center rounded-full md:size-16',
                    active ? 'bg-white' : 'bg-bun',
                  )}
                >
                  <Icon className="size-6 text-ketchup md:size-9" strokeWidth={1.75} />
                </span>
                {category.name}
              </button>
            )
          })}
        </nav>

        {/* Food cards */}
        <main className="min-h-0 flex-1 overflow-y-auto px-4 py-5 md:px-8 md:py-8">
          {isLoading ? (
            <p className="py-24 text-center text-2xl font-bold text-grill/50">Loading the menu…</p>
          ) : !activeCategory ? (
            <p className="py-24 text-center text-2xl font-bold text-grill/50">
              The menu isn't available right now. Please order at the counter.
            </p>
          ) : (
            <>
              <h2 className="text-4xl font-black tracking-tight md:text-5xl">{activeCategory.name}</h2>
              {activeCategory.description && (
                <p className="mt-1 text-lg text-grill/60">{activeCategory.description}</p>
              )}

              {visibleProducts.length === 0 ? (
                <p className="py-16 text-xl font-semibold text-grill/50">
                  Nothing here yet — try another category.
                </p>
              ) : (
                <div className="mt-6 grid grid-cols-2 gap-4 pb-4 lg:grid-cols-3 xl:grid-cols-4 md:gap-6">
                  {visibleProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      categoryName={categoryNames.get(product.category_id)}
                      inOrder={quantityOf(product.id)}
                      onSelect={setSelected}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Order bar */}
      <footer className="flex items-center gap-3 border-t border-grill/10 bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:gap-4 md:px-6 md:py-4">
        <button
          type="button"
          onClick={() => (itemCount > 0 ? setConfirmingReset(true) : startOver())}
          className="flex shrink-0 items-center gap-2 rounded-2xl border-2 border-grill/15 px-4 py-4 text-base font-bold text-grill/80 active:bg-grill/5 md:px-6 md:text-lg"
        >
          <RotateCcw className="size-5" />
          <span className="hidden sm:inline">Start over</span>
        </button>

        <div className="ml-auto flex min-w-0 flex-col items-end leading-tight">
          <span className="text-sm font-semibold text-grill/60 md:text-base">
            My order &middot; {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </span>
          <span className="text-2xl font-black md:text-3xl">{formatCurrency(subtotalOf(lines))}</span>
        </div>

        <button
          type="button"
          disabled={itemCount === 0}
          onClick={() => navigate('/order/review')}
          className="flex shrink-0 items-center gap-2 rounded-2xl bg-mustard px-5 py-4 text-lg font-extrabold text-grill shadow-[0_5px_0_var(--color-mustard-dark)] transition active:translate-y-1 active:shadow-[0_1px_0_var(--color-mustard-dark)] disabled:opacity-40 disabled:shadow-none md:px-8 md:text-xl"
        >
          Review order
          <ChevronRight className="size-6" strokeWidth={2.75} />
        </button>
      </footer>

      <ProductSheet
        product={selected}
        categoryName={selected ? categoryNames.get(selected.category_id) : undefined}
        onClose={() => setSelected(null)}
        onAdd={(product, variant, quantity) => {
          add(product, variant, quantity)
          setSelected(null)
        }}
      />
      <StartOverDialog
        open={confirmingReset}
        onCancel={() => setConfirmingReset(false)}
        onConfirm={startOver}
      />
    </div>
  )
}

export default MenuScreen
