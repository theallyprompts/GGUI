import { pngEmbedMetadata, pngExtractMetadata } from './png'
import { jpegEmbedMetadata, jpegExtractMetadata } from './jpeg'
import { webpEmbedMetadata, webpExtractMetadata } from './webp'

/** Patches a JSON string into an image's file bytes (PNG tEXt / JPEG COM / WEBP custom chunk).
 *  Returns the original bytes unchanged if the format isn't recognized. */
export function embedImageMetadata(bytes: Uint8Array, json: string): Uint8Array {
  return (
    pngEmbedMetadata(bytes, json) ?? jpegEmbedMetadata(bytes, json) ?? webpEmbedMetadata(bytes, json) ?? bytes
  )
}

/** Reads back a previously embedded JSON string, or null if none is present / format unrecognized. */
export function extractImageMetadata(bytes: Uint8Array): string | null {
  return pngExtractMetadata(bytes) ?? jpegExtractMetadata(bytes) ?? webpExtractMetadata(bytes)
}
