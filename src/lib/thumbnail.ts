/**
 * Client-side thumbnail cache for the results gallery. Runware doesn't provide a thumbnail API,
 * so a card showing e.g. a Seedream 4K result would otherwise decode the full multi-thousand-
 * pixel original just to paint a ~200px box — with a dozen or so of those mounted at once (the
 * grid isn't virtualized), that's enough decoded bitmap memory to make the whole tab sluggish.
 * This downsamples each result once via an offscreen canvas and caches the small JPEG data URI
 * in memory, keyed by the original media URL, so the grid never asks the browser to decode a
 * full-res image just to shrink it.
 */

const THUMBNAIL_MAX_DIMENSION = 480
const THUMBNAIL_JPEG_QUALITY = 0.82

const cache = new Map<string, string>()
const inFlight = new Map<string, Promise<string>>()

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

async function generateThumbnail(url: string): Promise<string> {
  const img = await loadImageElement(url)
  const scale = Math.min(1, THUMBNAIL_MAX_DIMENSION / Math.max(img.naturalWidth, img.naturalHeight))
  const width = Math.max(1, Math.round(img.naturalWidth * scale))
  const height = Math.max(1, Math.round(img.naturalHeight * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return url
  ctx.drawImage(img, 0, 0, width, height)
  return canvas.toDataURL('image/jpeg', THUMBNAIL_JPEG_QUALITY)
}

/**
 * Returns a cached thumbnail data URI for `url` if one already exists, else kicks off generation
 * and returns `null` for this call — callers should re-render once generation resolves (see
 * useThumbnail). Returns `url` itself as a fallback if thumbnailing ever fails, so a broken
 * generation never blanks out the image.
 */
export function getCachedThumbnail(url: string): string | null {
  return cache.get(url) ?? null
}

export function requestThumbnail(url: string, onReady: (dataUri: string) => void): void {
  const cached = cache.get(url)
  if (cached) {
    onReady(cached)
    return
  }
  let promise = inFlight.get(url)
  if (!promise) {
    promise = generateThumbnail(url)
      .catch(() => url)
      .then((dataUri) => {
        cache.set(url, dataUri)
        inFlight.delete(url)
        return dataUri
      })
    inFlight.set(url, promise)
  }
  void promise.then(onReady)
}
