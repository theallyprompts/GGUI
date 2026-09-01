import { useRef, useState } from 'react'
import { ImagePlus, Images, X } from 'lucide-react'
import { MyMediaPickerModal } from '../../MyMediaPickerModal'

interface UpscaleImageInputProps {
  value: string | null
  onChange: (dataUri: string | null) => void
}

function readFileAsDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export function UpscaleImageInput({ value, onChange }: UpscaleImageInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [showMyMedia, setShowMyMedia] = useState(false)

  async function handleFile(file: File | undefined | null) {
    if (!file || !file.type.startsWith('image/')) return
    onChange(await readFileAsDataUri(file))
  }

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label className="block text-sm font-medium text-neutral-5">
          Image to upscale <span className="text-brand-destructive">*</span>
        </label>
        {!value && (
          <button
            type="button"
            onClick={() => setShowMyMedia(true)}
            className="flex items-center gap-1 text-xs font-medium text-brand-green-text hover:underline"
          >
            <Images className="h-3 w-3" />
            Insert from My Media
          </button>
        )}
      </div>
      {value ? (
        <div className="relative overflow-hidden rounded-md border border-neutral-70">
          <img src={value} alt="Input" className="max-h-64 w-full object-contain bg-input" />
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label="Remove input image"
            className="absolute top-2 right-2 rounded-md bg-neutral-90/80 p-1.5 text-neutral-5 backdrop-blur transition-colors hover:bg-neutral-90"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
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
          className={`flex w-full flex-col items-center gap-1.5 rounded-md border border-dashed px-3 py-6 text-xs text-neutral-40 transition-colors ${
            isDragging
              ? 'border-brand-green-text bg-brand-green/5'
              : 'border-neutral-70 bg-input hover:bg-neutral-80 hover:text-neutral-5'
          }`}
        >
          <ImagePlus className="h-5 w-5" />
          Drop an image, or click to upload
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => void handleFile(e.target.files?.[0])}
      />

      {showMyMedia && (
        <MyMediaPickerModal onClose={() => setShowMyMedia(false)} onSelect={(url) => onChange(url)} />
      )}
    </div>
  )
}
