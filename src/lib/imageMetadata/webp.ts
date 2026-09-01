// Raw WEBP (RIFF container) manipulation — inserts/reads a custom "RwGn" chunk holding our
// JSON metadata payload. RIFF readers skip chunk types they don't recognize, so this survives
// being opened/re-saved by most tools that preserve unknown chunks, though (unlike EXIF) it's
// not a registered WEBP metadata type — some re-encoders will strip it. No re-encoding here,
// so the pixel data itself is untouched either way.

const CHUNK_ID = 'RwGn'

function isWebp(bytes: Uint8Array): boolean {
  if (bytes.length < 12) return false
  const riff = new TextDecoder().decode(bytes.slice(0, 4))
  const webp = new TextDecoder().decode(bytes.slice(8, 12))
  return riff === 'RIFF' && webp === 'WEBP'
}

function readUint32LE(bytes: Uint8Array, offset: number): number {
  return (bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24)) >>> 0
}

function writeUint32LE(value: number): Uint8Array {
  return new Uint8Array([value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff])
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

export function webpEmbedMetadata(bytes: Uint8Array, json: string): Uint8Array | null {
  if (!isWebp(bytes)) return null

  const textBytes = new TextEncoder().encode(json)
  const padded = textBytes.length % 2 === 1 ? concat([textBytes, new Uint8Array([0])]) : textBytes
  const chunk = concat([new TextEncoder().encode(CHUNK_ID), writeUint32LE(textBytes.length), padded])

  // Real decoders require the first chunk after "WEBP" to be VP8/VP8L/VP8X — inserting ours
  // there is spec-legal RIFF but breaks decoding in practice. Append after the existing chunks
  // instead, which every RIFF-compliant reader tolerates.
  const newRiffSize = readUint32LE(bytes, 4) + chunk.length

  return concat([
    bytes.slice(0, 4), // "RIFF"
    writeUint32LE(newRiffSize),
    bytes.slice(8), // "WEBP" + existing chunks
    chunk,
  ])
}

export function webpExtractMetadata(bytes: Uint8Array): string | null {
  if (!isWebp(bytes)) return null

  let offset = 12
  while (offset + 8 <= bytes.length) {
    const id = new TextDecoder().decode(bytes.slice(offset, offset + 4))
    const size = readUint32LE(bytes, offset + 4)
    const dataStart = offset + 8

    if (id === CHUNK_ID) {
      return new TextDecoder().decode(bytes.slice(dataStart, dataStart + size))
    }

    offset = dataStart + size + (size % 2) // chunks are padded to an even length
  }
  return null
}
