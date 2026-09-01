import { useRef, useState } from 'react'
import { ImagePlus, Images, X } from 'lucide-react'
import type { FrameImageEntry } from '../../../store/models/minimaxH3.store'
import { MyMediaPickerModal } from '../../MyMediaPickerModal'

interface FrameImagesInputProps {
  value: FrameImageEntry[]
  onChange: (frame: 'first' | 'last', image: string | null) => void
}

function readFileAsDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export function FrameImagesInput({ value, onChange }: FrameImagesInputProps) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-neutral-5">Frame images</label>
      <div className="grid grid-cols-2 gap-2">
        <FrameSlot
          label="First frame"
          image={value.find((f) => f.frame === 'first')?.image ?? null}
          onChange={(image) => onChange('first', image)}
        />
        <FrameSlot
          label="Last frame"
          image={value.find((f) => f.frame === 'last')?.image ?? null}
          onChange={(image) => onChange('last', image)}
        />
      </div>
    </div>
  )
}

function FrameSlot({
  label,
  image,
  onChange,
}: {
  label: string
  image: string | null
  onChange: (image: string | null) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [showMyMedia, setShowMyMedia] = useState(false)

  async function handleFile(file: File | undefined | null) {
    if (!file || !file.type.startsWith('image/')) return
    onChange(await readFileAsDataUri(file))
  }

  if (image) {
    return (
      <div className="relative overflow-hidden rounded-md border border-neutral-70">
        <img src={image} alt={label} className="h-28 w-full bg-input object-cover" />
        <span className="absolute left-1.5 top-1.5 rounded bg-neutral-90/80 px-1.5 py-0.5 text-[10px] font-medium text-neutral-5 backdrop-blur">
          {label}
        </span>
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-label={`Remove ${label.toLowerCase()}`}
          className="absolute right-1.5 top-1.5 rounded-md bg-neutral-90/80 p-1 text-neutral-5 backdrop-blur transition-colors hover:bg-neutral-90"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setIsDragging(false)
          void handleFile(e.dataTransfer.files[0])
        }}
        className={`flex h-28 w-full flex-col items-center justify-center gap-1 rounded-md border border-dashed text-[11px] text-neutral-40 transition-colors ${
          isDragging
            ? 'border-brand-green-text bg-brand-green/5'
            : 'border-neutral-70 bg-input hover:bg-neutral-80 hover:text-neutral-5'
        }`}
      >
        <ImagePlus className="h-4 w-4" />
        {label}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => void handleFile(e.target.files?.[0])}
        />
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setShowMyMedia(true)
        }}
        className="absolute bottom-1 right-1 flex items-center gap-0.5 rounded-md bg-neutral-90/80 px-1.5 py-0.5 text-[10px] font-medium text-brand-green-text backdrop-blur hover:underline"
      >
        <Images className="h-2.5 w-2.5" />
        My Media
      </button>

      {showMyMedia && (
        <MyMediaPickerModal onClose={() => setShowMyMedia(false)} onSelect={(url) => onChange(url)} />
      )}
    </div>
  )
}
