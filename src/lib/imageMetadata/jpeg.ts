// Raw JPEG marker manipulation — inserts/reads a COM (comment, 0xFFFE) segment holding our
// JSON metadata payload, placed right after the SOI marker. No re-encoding, lossless.

const COM_MARKER = 0xfffe
const SOS_MARKER = 0xffda // Start of scan — entropy-coded data follows; stop scanning markers here.

function isJpeg(bytes: Uint8Array): boolean {
  return bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xd8
}

function concat(chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((sum, c) => sum + c.length, 0)
  const out = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    out.set(chunk, offset)
    offset += chunk.length
  }
  return out
}

export function jpegEmbedMetadata(bytes: Uint8Array, json: string): Uint8Array | null {
  if (!isJpeg(bytes)) return null

  const textBytes = new TextEncoder().encode(json)
  // COM segment length field covers itself (2 bytes) plus the payload, per the JPEG spec.
  const segmentLength = textBytes.length + 2
  if (segmentLength > 0xffff) return null // Wildly oversized metadata — bail rather than corrupt the file.

  const marker = new Uint8Array([0xff, 0xfe, (segmentLength >>> 8) & 0xff, segmentLength & 0xff])
  const comSegment = concat([marker, textBytes])

  // Insert immediately after the 2-byte SOI marker.
  return concat([bytes.slice(0, 2), comSegment, bytes.slice(2)])
}

export function jpegExtractMetadata(bytes: Uint8Array): string | null {
  if (!isJpeg(bytes)) return null

  let offset = 2
  while (offset + 4 <= bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset++
      continue
    }
    const marker = (bytes[offset] << 8) | bytes[offset + 1]
    if (marker === SOS_MARKER) break

    const length = (bytes[offset + 2] << 8) | bytes[offset + 3]
    if (marker === COM_MARKER) {
      const textBytes = bytes.slice(offset + 4, offset + 2 + length)
      return new TextDecoder().decode(textBytes)
    }

    offset += 2 + length
  }
  return null
}
