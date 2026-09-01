import { useEffect, useState } from 'react'
import { getCachedThumbnail, requestThumbnail } from './thumbnail'

/** Returns a downscaled thumbnail data URI for `url` once generated, or `null` while pending —
 *  callers should fall back to a placeholder/skeleton until it resolves, not the raw `url`,
 *  since falling back to the full-res original defeats the point (see thumbnail.ts). */
export function useThumbnail(url: string | undefined): string | null {
  const [thumbnail, setThumbnail] = useState<string | null>(() => (url ? getCachedThumbnail(url) : null))

  useEffect(() => {
    if (!url) {
      setThumbnail(null)
      return
    }
    const cached = getCachedThumbnail(url)
    if (cached) {
      setThumbnail(cached)
      return
    }
    setThumbnail(null)
    let cancelled = false
    requestThumbnail(url, (dataUri) => {
      if (!cancelled) setThumbnail(dataUri)
    })
    return () => {
      cancelled = true
    }
  }, [url])

  return thumbnail
}
