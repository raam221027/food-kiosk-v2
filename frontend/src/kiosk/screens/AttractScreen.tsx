import type { CSSProperties } from 'react'
import { useNavigate } from 'react-router'
import { CupSoda, Drumstick, Hamburger, Hand, IceCreamCone, Popcorn } from 'lucide-react'

import { useMenu } from '../useMenu'
import { useOrder } from '../useOrder'

/** Scattered food icons; `tilt` and `delay` keep them from bobbing in lockstep. */
const FLOATERS = [
  { Icon: Hamburger, className: 'left-[6%] top-[18%] size-28 md:size-40', tilt: '-12deg', delay: '0s' },
  { Icon: CupSoda, className: 'right-[8%] top-[14%] size-24 md:size-36', tilt: '10deg', delay: '1.2s' },
  { Icon: Popcorn, className: 'left-[10%] bottom-[22%] size-24 md:size-32', tilt: '8deg', delay: '2.1s' },
  { Icon: IceCreamCone, className: 'right-[10%] bottom-[24%] size-24 md:size-32', tilt: '-8deg', delay: '0.6s' },
  { Icon: Drumstick, className: 'left-[42%] top-[6%] size-16 md:size-24', tilt: '20deg', delay: '3s' },
]

/**
 * The idle screen the kiosk sits on between customers. The whole surface is a
 * single button so a tap anywhere starts a fresh order.
 */
const AttractScreen = () => {
  const navigate = useNavigate()
  const reset = useOrder((state) => state.reset)
  const { restaurantName } = useMenu()

  const start = () => {
    reset()
    navigate('/order')
  }

  return (
    // A div rather than a <button>: buttons may only hold inline content, and
    // this one wraps headings.
    <div
      role="button"
      tabIndex={0}
      onClick={start}
      onKeyDown={(event) => (event.key === 'Enter' || event.key === ' ') && start()}
      className="relative flex min-h-svh w-full flex-col items-center justify-between overflow-hidden bg-ketchup px-6 py-12 text-white"
    >
      {FLOATERS.map(({ Icon, className, tilt, delay }) => (
        <Icon
          key={className}
          aria-hidden
          strokeWidth={1.25}
          className={`pointer-events-none absolute animate-float text-mustard/90 ${className}`}
          style={{ '--tilt': tilt, animationDelay: delay } as CSSProperties}
        />
      ))}

      <header className="relative text-center">
        <p className="text-lg font-semibold tracking-[0.3em] text-mustard uppercase">Welcome to</p>
        <h1 className="mt-2 text-5xl font-black tracking-tight md:text-7xl">{restaurantName}</h1>
      </header>

      <div className="relative flex flex-col items-center gap-8">
        <p className="max-w-[14ch] text-center text-6xl leading-[0.95] font-black tracking-tight text-balance md:text-8xl">
          Order here &amp; skip the line
        </p>
        <span className="flex items-center gap-4 rounded-full bg-mustard px-10 py-6 text-2xl font-extrabold text-grill shadow-[0_10px_0_var(--color-mustard-dark)] md:px-14 md:py-8 md:text-4xl">
          <Hand className="size-9 animate-nudge md:size-12" strokeWidth={2.25} />
          Touch here to start
        </span>
      </div>

      <footer className="relative text-center text-lg font-medium text-white/85 md:text-xl">
        Eat in or take out &middot; Pay at the counter
      </footer>
    </div>
  )
}

export default AttractScreen
