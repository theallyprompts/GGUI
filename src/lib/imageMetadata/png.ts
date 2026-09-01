// Raw PNG chunk manipulation — inserts/reads a tEXt chunk holding our JSON metadata payload,
// the same mechanism A1111/Civitai use for their "parameters" text chunk. No re-encoding,
// so this is lossless and works on any PNG regardless of how it was produced.

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
const KEYWORD = 'runware-gen'

function isPng(bytes: Uint8Array): boolean {
  if (bytes.length < 8) return false
  return PNG_SIGNATURE.every((b, i) => bytes[i] === b)
}

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff
  for (const byte of bytes) {
    crc ^= byte
    for (let i = 0; i < 8; i++) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1
    }
  }
  return (crc ^ 0xffffffff) >>> 0
}

function writeUint32BE(value: number): Uint8Array {
  const out = new Uint8Array(4)
  out[0] = (value >>> 24) & 0xff
  out[1] = (value >>> 16) & 0xff
  out[2] = (value >>> 8) & 0xff
  out[3] = value & 0xff
  return out
}

function readUint32BE(bytes: Uint8Array, offset: number): number {
  return (
    ((bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3]) >>> 0
  )
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

function buildTextChunk(keyword: string, text: string): Uint8Array {
  const keywordBytes = new TextEncoder().encode(keyword)
  const textBytes = new TextEncoder().encode(text)
  const data = concat([keywordBytes, new Uint8Array([0]), textBytes])
  const type = new TextEncoder().encode('tEXt')
  const crc = crc32(concat([type, data]))
  return concat([writeUint32BE(data.length), type, data, writeUint32BE(crc)])
}

export function pngEmbedMetadata(bytes: Uint8Array, json: string): Uint8Array | null {
  if (!isPng(bytes)) return null

  // First chunk after the 8-byte signature is always IHDR; insert our tEXt chunk right after it.
  const ihdrLength = readUint32BE(bytes, 8)
  const ihdrChunkEnd = 8 + 4 + 4 + ihdrLength + 4 // length + type + data + crc

  const textChunk = buildTextChunk(KEYWORD, json)
  return concat([bytes.slice(0, ihdrChunkEnd), textChunk, bytes.slice(ihdrChunkEnd)])
}

export function pngExtractMetadata(bytes: Uint8Array): string | null {
  if (!isPng(bytes)) return null

  let offset = 8
  while (offset + 8 <= bytes.length) {
    const length = readUint32BE(bytes, offset)
    const type = new TextDecoder().decode(bytes.slice(offset + 4, offset + 8))
    const dataStart = offset + 8

    if (type === 'tEXt' || type === 'iTXt') {
      const data = bytes.slice(dataStart, dataStart + length)
      const nullIndex = data.indexOf(0)
      if (nullIndex !== -1) {
        const keyword = new TextDecoder().decode(data.slice(0, nullIndex))
        if (keyword === KEYWORD || keyword === 'parameters') {
          // iTXt has extra flag/language/translated-keyword fields before the text; tEXt does not.
          const textStart = type === 'iTXt' ? findITxtTextStart(data, nullIndex) : nullIndex + 1
          return new TextDecoder().decode(data.slice(textStart))
        }
      }
    }

    if (type === 'IEND') break
    offset = dataStart + length + 4 // skip data + CRC
  }
  return null
}

function findITxtTextStart(data: Uint8Array, keywordNullIndex: number): number {
  // iTXt layout after keyword\0: compression flag (1B), compression method (1B),
  // language tag\0, translated keyword\0, then text.
  let i = keywordNullIndex + 1 + 2
  for (let skips = 0; skips < 2; skips++) {
    while (i < data.length && data[i] !== 0) i++
    i++
  }
  return i
}
