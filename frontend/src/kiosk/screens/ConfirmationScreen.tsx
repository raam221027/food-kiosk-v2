import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { CircleCheckBig } from 'lucide-react'

import { formatCurrency } from '@/admin/utils/format'
import { useOrder } from '../useOrder'

/** Seconds before the kiosk returns to the attract screen on its own. */
const RETURN_AFTER = 20

/** Order number + what to do next, then back to the start for the next customer. */
const ConfirmationScreen = () => {
  const navigate = useNavigate()
  const placed = useOrder((state) => state.placed)
  const reset = useOrder((state) => state.reset)
  const [secondsLeft, setSecondsLeft] = useState(RETURN_AFTER)

  const finish = () => {
    reset()
    navigate('/', { replace: true })
  }

  useEffect(() => {
    if (!placed) return
    const tick = window.setInterval(() => setSecondsLeft((seconds) => seconds - 1), 1000)
    const done = window.setTimeout(() => {
      reset()
      navigate('/', { replace: true })
    }, RETURN_AFTER * 1000)
    return () => {
      window.clearInterval(tick)
      window.clearTimeout(done)
    }
  }, [placed, reset, navigate])

  if (!placed) return <Navigate to="/" replace />

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-8 bg-ketchup px-6 py-12 text-center text-white">
      <CircleCheckBig className="size-24 text-mustard animate-in zoom-in md:size-32" strokeWidth={1.75} />
      <div>
        <h1 className="text-5xl font-black tracking-tight md:text-7xl">Thank you!</h1>
        <p className="mt-3 text-xl text-white/85 md:text-2xl">Your order number is</p>
      </div>

      <div className="rounded-[2rem] bg-white px-14 py-8 text-grill shadow-[0_12px_0_var(--color-ketchup-dark)] md:px-20">
        <span className="text-8xl font-black tracking-tight tabular-nums md:text-9xl">{placed.number}</span>
      </div>

      <div className="max-w-xl text-xl leading-relaxed md:text-2xl">
        <p className="font-bold">
          Please pay {formatCurrency(placed.total)} at the counter.
        </p>
        <p className="text-white/85">
          {placed.type === 'dine-in'
            ? 'Take a seat — we’ll call your number when your food is ready.'
            : 'Wait near the counter — we’ll call your number when your bag is ready.'}
        </p>
      </div>

      {placed.isDemo && (
        <p className="max-w-md rounded-2xl bg-black/20 px-5 py-3 text-sm text-white/80">
          The kiosk couldn’t reach the kitchen, so this order was not sent. Please tell a staff member.
        </p>
      )}

      <button
        type="button"
        onClick={finish}
        className="rounded-2xl bg-mustard px-12 py-5 text-2xl font-extrabold text-grill shadow-[0_6px_0_var(--color-mustard-dark)] active:translate-y-1 active:shadow-[0_2px_0_var(--color-mustard-dark)]"
      >
        Done
      </button>
      <p className="text-base text-white/70">Returning to the start screen in {secondsLeft}s</p>
    </div>
  )
}

export default ConfirmationScreen
