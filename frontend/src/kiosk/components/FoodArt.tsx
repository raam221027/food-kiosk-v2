import { useState } from 'react'

import { resolveImage } from '@/lib/imageUrl'
import { cn } from '@/lib/utils'
import { iconFor } from '../foodIcons'

interface FoodArtProps {
  name: string
  categoryName?: string | null
  image?: string | null
  className?: string
  iconClassName?: string
}

/** The product photo, or a bold illustrated tile when there is no photo yet. */
const FoodArt = ({ name, categoryName, image, className, iconClassName }: FoodArtProps) => {
  const [failed, setFailed] = useState(false)
  const src = resolveImage(image)

  if (src && !failed) {
    return (
      <div className={cn('overflow-hidden bg-bun', className)}>
        <img
          src={src}
          alt={name}
          draggable={false}
          onError={() => setFailed(true)}
          className="size-full object-cover"
        />
      </div>
    )
  }

  const Icon = iconFor(name, categoryName)
  return (
    <div
      aria-hidden
      className={cn(
        'flex items-center justify-center bg-radial from-mustard/60 via-mustard/25 to-bun',
        className,
      )}
    >
      <Icon className={cn('size-1/2 text-ketchup drop-shadow-sm', iconClassName)} strokeWidth={1.5} />
    </div>
  )
}

export default FoodArt
