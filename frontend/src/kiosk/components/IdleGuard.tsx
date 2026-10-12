import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { Clock } from 'lucide-react'

import { useOrder } from '../useOrder'
import KioskModal from './KioskModal'

/** No touches for this long and the kiosk asks if anyone is still there. */
const IDLE_AFTER_MS = 60_000
/** Seconds the "Still there?" prompt waits before abandoning the order. */
const COUNTDOWN = 20

const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'wheel'] as const

/**
 * Walk-away protection: a customer who leaves halfway through should not hand
 * their basket to the next person in line. After a minute without input it
 * asks "Still there?", and if nobody answers the order is cleared.
 */
const IdleGuard = () => {
  const navigate = useNavigate()
  const reset = useOrder((state) => state.reset)
  const [prompting, setPrompting] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN)

  // Restart the idle clock on every touch while the prompt is closed.
  useEffect(() => {
    if (prompting) return
    let timer = window.setTimeout(() => setPrompting(true), IDLE_AFTER_MS)
    const onActivity = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(() => setPrompting(true), IDLE_AFTER_MS)
    }
    ACTIVITY_EVENTS.forEach((name) => window.addEventListener(name, onActivity, { passive: true }))
    return () => {
      window.clearTimeout(timer)
      ACTIVITY_EVENTS.forEach((name) => window.removeEventListener(name, onActivity))
    }
  }, [prompting])

  // Count down while the prompt is open, then start over.
  useEffect(() => {
    if (!prompting) return
    setSecondsLeft(COUNTDOWN)
    const tick = window.setInterval(() => setSecondsLeft((seconds) => seconds - 1), 1000)
    const expire = window.setTimeout(() => {
      reset()
      navigate('/', { replace: true })
    }, COUNTDOWN * 1000)
    return () => {
      window.clearInterval(tick)
      window.clearTimeout(expire)
    }
  }, [prompting, reset, navigate])

  return (
    <KioskModal open={prompting} onClose={() => setPrompting(false)} className="max-w-md">
      <div className="flex flex-col items-center gap-4 p-8 text-center text-grill">
        <span className="flex size-20 items-center justify-center rounded-full bg-mustard/30">
          <Clock className="size-10 text-ketchup" />
        </span>
        <h2 className="text-3xl font-black">Are you still there?</h2>
        <p className="text-lg text-grill/65">
          Your order will be cleared in{' '}
          <span className="font-bold text-ketchup tabular-nums">{Math.max(0, secondsLeft)}</span>{' '}
          seconds.
        </p>
        <button
          type="button"
          onClick={() => setPrompting(false)}
          className="mt-2 w-full rounded-2xl bg-mustard py-5 text-xl font-extrabold shadow-[0_5px_0_var(--color-mustard-dark)] active:translate-y-1 active:shadow-[0_1px_0_var(--color-mustard-dark)]"
        >
          Yes, I need more time
        </button>
      </div>
    </KioskModal>
  )
}

export default IdleGuard
