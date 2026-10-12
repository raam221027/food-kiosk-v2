import { useEffect, type ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface KioskModalProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  className?: string
}

/**
 * Full-screen dimmed overlay with a centred panel. Tapping the backdrop closes
 * it, which is what people expect on a touch screen with no Escape key.
 */
const KioskModal = ({ open, onClose, children, className }: KioskModalProps) => {
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-grill/60 p-0 backdrop-blur-sm animate-in fade-in sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
        className={cn(
          'w-full max-w-xl overflow-hidden rounded-t-3xl bg-white shadow-2xl animate-in slide-in-from-bottom-8 sm:rounded-3xl',
          className,
        )}
      >
        {children}
      </div>
    </div>
  )
}

export default KioskModal
