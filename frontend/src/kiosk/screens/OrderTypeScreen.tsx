import { useNavigate } from 'react-router'
import { ArrowLeft, ShoppingBag, Utensils, type LucideIcon } from 'lucide-react'

import { useOrder, type OrderType } from '../useOrder'

const CHOICES: { type: OrderType; label: string; hint: string; Icon: LucideIcon }[] = [
  { type: 'dine-in', label: 'Eat In', hint: 'Enjoy your meal here', Icon: Utensils },
  { type: 'take-out', label: 'Take Out', hint: 'Packed to go', Icon: ShoppingBag },
]

/** Second screen: dine-in or take-out, which the kitchen needs to pack the order. */
const OrderTypeScreen = () => {
  const navigate = useNavigate()
  const setOrderType = useOrder((state) => state.setOrderType)

  const choose = (type: OrderType) => {
    setOrderType(type)
    navigate('/order/menu')
  }

  return (
    <div className="flex min-h-svh flex-col bg-bun px-6 py-10 text-grill">
      <h1 className="mt-6 text-center text-4xl font-black tracking-tight text-balance md:mt-16 md:text-6xl">
        Where will you be eating today?
      </h1>

      <div className="mx-auto mt-12 grid w-full max-w-4xl flex-1 grid-cols-1 content-center gap-6 sm:grid-cols-2 md:gap-10">
        {CHOICES.map(({ type, label, hint, Icon }) => (
          <button
            key={type}
            type="button"
            onClick={() => choose(type)}
            className="group flex aspect-[4/3] flex-col items-center justify-center gap-6 rounded-[2rem] border-4 border-transparent bg-white p-8 shadow-lg transition active:scale-[0.97] active:border-mustard sm:aspect-[3/4]"
          >
            <span className="flex size-32 items-center justify-center rounded-full bg-mustard/30 transition group-active:bg-mustard md:size-44">
              <Icon className="size-16 text-ketchup md:size-24" strokeWidth={1.75} />
            </span>
            <span className="text-4xl font-black md:text-5xl">{label}</span>
            <span className="text-lg text-grill/60 md:text-xl">{hint}</span>
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => navigate('/')}
        className="mx-auto mt-10 flex items-center gap-2 rounded-full px-6 py-4 text-lg font-semibold text-grill/70 active:bg-grill/10"
      >
        <ArrowLeft className="size-5" />
        Back
      </button>
    </div>
  )
}

export default OrderTypeScreen
