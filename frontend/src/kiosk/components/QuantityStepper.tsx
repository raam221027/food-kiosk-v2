import { Minus, Plus, Trash2 } from 'lucide-react'

import { cn } from '@/lib/utils'
import { MAX_QUANTITY } from '../useOrder'

interface QuantityStepperProps {
  value: number
  onChange: (value: number) => void
  /** Lowest value the minus button reaches; 0 lets it remove the item. */
  min?: number
  size?: 'md' | 'lg'
}

/** Large, thumb-sized −/+ control; the minus turns into a bin at zero. */
const QuantityStepper = ({ value, onChange, min = 1, size = 'md' }: QuantityStepperProps) => {
  const button = cn(
    'flex items-center justify-center rounded-full border-2 border-grill/15 bg-white text-grill',
    'transition active:scale-90 disabled:opacity-30',
    size === 'lg' ? 'size-16' : 'size-12',
  )
  const icon = size === 'lg' ? 'size-7' : 'size-5'
  const removes = min === 0 && value === 1

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        className={button}
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
        aria-label={removes ? 'Remove item' : 'Decrease quantity'}
      >
        {removes ? <Trash2 className={cn(icon, 'text-ketchup')} /> : <Minus className={icon} />}
      </button>
      <span
        aria-live="polite"
        className={cn(
          'min-w-[2ch] text-center font-extrabold tabular-nums',
          size === 'lg' ? 'text-4xl' : 'text-2xl',
        )}
      >
        {value}
      </span>
      <button
        type="button"
        className={cn(button, 'border-mustard bg-mustard')}
        disabled={value >= MAX_QUANTITY}
        onClick={() => onChange(value + 1)}
        aria-label="Increase quantity"
      >
        <Plus className={icon} />
      </button>
    </div>
  )
}

export default QuantityStepper
