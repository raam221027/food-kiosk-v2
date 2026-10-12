import { RotateCcw } from 'lucide-react'

import KioskModal from './KioskModal'

interface StartOverDialogProps {
  open: boolean
  onCancel: () => void
  onConfirm: () => void
}

/** In-page confirmation — the browser's confirm() is no good on a kiosk. */
const StartOverDialog = ({ open, onCancel, onConfirm }: StartOverDialogProps) => (
  <KioskModal open={open} onClose={onCancel} className="max-w-md">
    <div className="flex flex-col items-center gap-4 p-8 text-center">
      <span className="flex size-20 items-center justify-center rounded-full bg-ketchup/10">
        <RotateCcw className="size-10 text-ketchup" />
      </span>
      <h2 className="text-3xl font-black text-grill">Start over?</h2>
      <p className="text-lg text-grill/65">Everything in your order will be removed.</p>
      <div className="mt-4 grid w-full grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-2xl border-2 border-grill/15 py-4 text-lg font-bold text-grill active:bg-grill/5"
        >
          Keep ordering
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="rounded-2xl bg-ketchup py-4 text-lg font-bold text-white active:bg-ketchup-dark"
        >
          Start over
        </button>
      </div>
    </div>
  </KioskModal>
)

export default StartOverDialog
