import { useEffect, useMemo, useRef } from 'react'
import { CButton, CFormLabel, CFormText } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilImage, cilTrash } from '@coreui/icons'

import { resolveImage } from '@/lib/imageUrl'

interface ImageFieldProps {
  label?: string
  /** Stored path of the current image, if any. */
  current?: string | null
  /** Newly picked file waiting to be uploaded. */
  file: File | null
  /** True when the user asked to remove the current image. */
  removed?: boolean
  onFileChange: (file: File | null) => void
  /** Omit to hide the remove button (e.g. categories, which can only replace). */
  onRemove?: () => void
}

const MAX_BYTES = 4 * 1024 * 1024

/** Image picker with a live preview. Uploading happens when the form saves. */
const ImageField = ({ label = 'Image', current, file, removed, onFileChange, onRemove }: ImageFieldProps) => {
  const input = useRef<HTMLInputElement>(null)

  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file])
  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview)
  }, [preview])

  const src = preview ?? (removed ? null : resolveImage(current))
  const tooBig = file !== null && file.size > MAX_BYTES

  return (
    <div>
      <CFormLabel>{label}</CFormLabel>
      <div className="d-flex align-items-center gap-3">
        <div
          className="rounded border bg-body-tertiary d-flex align-items-center justify-content-center overflow-hidden"
          style={{ width: '6rem', height: '6rem', flexShrink: 0 }}
        >
          {src ? (
            <img src={src} alt="" className="w-100 h-100" style={{ objectFit: 'cover' }} />
          ) : (
            <CIcon icon={cilImage} size="xl" className="text-body-secondary" />
          )}
        </div>
        <div className="d-flex flex-column gap-2">
          <div className="d-flex gap-2">
            <CButton color="secondary" variant="outline" size="sm" onClick={() => input.current?.click()}>
              {src ? 'Replace' : 'Upload'}
            </CButton>
            {onRemove && src && (
              <CButton
                color="danger"
                variant="ghost"
                size="sm"
                onClick={() => {
                  onFileChange(null)
                  if (current) onRemove()
                }}
              >
                <CIcon icon={cilTrash} className="me-1" />
                Remove
              </CButton>
            )}
          </div>
          <CFormText className={tooBig ? 'text-danger' : undefined}>
            {tooBig ? 'This image is larger than 4 MB.' : 'JPG, PNG or WebP, up to 4 MB.'}
          </CFormText>
        </div>
      </div>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={(event) => {
          onFileChange(event.target.files?.[0] ?? null)
          event.target.value = ''
        }}
      />
    </div>
  )
}

export default ImageField
