import { apiRoot } from '@/services/api'

/**
 * Product and category images are stored as paths on Laravel's public disk
 * unless someone pasted a full URL, so relative paths resolve against /storage.
 */
export const resolveImage = (image?: string | null): string | null => {
  if (!image) return null
  if (/^(https?:|data:|blob:)/.test(image)) return image
  const root = (apiRoot.defaults.baseURL ?? '').replace(/\/$/, '')
  return `${root}/storage/${image.replace(/^\/?(storage\/)?/, '')}`
}
