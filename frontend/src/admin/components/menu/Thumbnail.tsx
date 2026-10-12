import CIcon from '@coreui/icons-react'
import { cilImage } from '@coreui/icons'

import { resolveImage } from '@/lib/imageUrl'

/** Small square image for table rows, with a placeholder when there is none. */
const Thumbnail = ({ image, size = '2.75rem' }: { image?: string | null; size?: string }) => {
  const src = resolveImage(image)

  return (
    <div
      className="rounded bg-body-tertiary d-flex align-items-center justify-content-center overflow-hidden"
      style={{ width: size, height: size, flexShrink: 0 }}
    >
      {src ? (
        <img src={src} alt="" className="w-100 h-100" style={{ objectFit: 'cover' }} />
      ) : (
        <CIcon icon={cilImage} className="text-body-secondary" />
      )}
    </div>
  )
}

export default Thumbnail
