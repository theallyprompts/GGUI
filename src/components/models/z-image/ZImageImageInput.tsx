import { useEffect, useRef, useState } from 'react'
import { ImagePlus, Images, Maximize2, PenTool, X } from 'lucide-react'
import { MaskEditor } from './MaskEditor'
import { OutpaintEditor } from './OutpaintEditor'
import { snapDimension, type ImageInferenceModelDefinition } from '../../../lib/models'
import type { OutpaintSpec } from '../../../lib/runware/types'
import { MyMediaPickerModal } from '../../MyMediaPickerModal'

interface ImageInputProps {
  value: string | null
  onChange: (dataUri: string | null) => void
  maskValue: string | null
  onMaskChange: (dataUri: string | null) => void
  maskMargin: number
  outpaintValue: OutpaintSpec | null
  onOutpaintChange: (outpaint: OutpaintSpec | null, dimensions: { width: number; height: number }) => void
  model: ImageInferenceModelDefinition
}

function readFileAsDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export function ZImageImageInput({
  value,
  onChange,
  maskValue,
  onMaskChange,
  maskMargin,
  outpaintValue,
  onOutpaintChange,
  model,
}: ImageInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isEditingMask, setIsEditingMask] = useState(false)
  const [isEditingOutpaint, setIsEditingOutpaint] = useState(false)
  const [showMyMedia, setShowMyMedia] = useState(false)
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null)

  useEffect(() => {
    if (!value) {
      setNaturalSize(null)
      return
    }
    let cancelled = false
    const img = new Image()
    img.onload = () => {
      if (!cancelled) setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight })
    }
    img.src = value
    return () => {
      cancelled = true
    }
  }, [value])

  async function handleFile(file: File | undefined | null) {
    if (!file || !file.type.startsWith('image/')) return
    onChange(await readFileAsDataUri(file))
  }

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label className="block text-sm font-medium text-neutral-5">Input image</label>
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
          <img src={value} alt="Input" className="max-h-48 w-full object-contain bg-input" />
          <div className="absolute top-2 left-2 flex flex-col items-start gap-1">
            {maskValue && (
              <span className="flex items-center gap-1 rounded-md bg-neutral-90/80 py-1 pr-1 pl-2 text-[11px] font-medium text-brand-green-text backdrop-blur">
                Mask set
                <button
                  type="button"
                  onClick={() => onMaskChange(null)}
                  aria-label="Remove mask"
                  title="Remove mask"
                  className="rounded p-0.5 text-brand-green-text transition-colors hover:bg-neutral-90 hover:text-neutral-5"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {outpaintValue && (
              <span className="flex items-center gap-1 rounded-md bg-neutral-90/80 py-1 pr-1 pl-2 text-[11px] font-medium text-brand-green-text backdrop-blur">
                Canvas extended
                <button
                  type="button"
                  onClick={() =>
                    onOutpaintChange(
                      null,
                      naturalSize
                        ? {
                            width: snapDimension(model, naturalSize.width),
                            height: snapDimension(model, naturalSize.height),
                          }
                        : { width: model.minDimension, height: model.minDimension },
                    )
                  }
                  aria-label="Remove canvas extension"
                  title="Remove canvas extension"
                  className="rounded p-0.5 text-brand-green-text transition-colors hover:bg-neutral-90 hover:text-neutral-5"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
          <div className="absolute top-2 right-2 flex gap-1.5">
            <button
              type="button"
              onClick={() => setIsEditingOutpaint(true)}
              aria-label="Extend canvas"
              title="Extend canvas"
              className="rounded-md bg-neutral-90/80 p-1.5 text-neutral-5 backdrop-blur transition-colors hover:bg-neutral-90"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setIsEditingMask(true)}
              aria-label="Edit inpaint mask"
              title="Edit inpaint mask"
              className="rounded-md bg-neutral-90/80 p-1.5 text-neutral-5 backdrop-blur transition-colors hover:bg-neutral-90"
            >
              <PenTool className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onChange(null)}
              aria-label="Remove input image"
              className="rounded-md bg-neutral-90/80 p-1.5 text-neutral-5 backdrop-blur transition-colors hover:bg-neutral-90"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
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

      {isEditingMask && value && (
        <MaskEditor
          image={value}
          initialMask={maskValue}
          maskMargin={maskMargin}
          onClose={() => setIsEditingMask(false)}
          onSave={(mask) => {
            onMaskChange(mask)
            setIsEditingMask(false)
          }}
        />
      )}

      {isEditingOutpaint && value && (
        <OutpaintEditor
          image={value}
          model={model}
          initialOutpaint={outpaintValue}
          onClose={() => setIsEditingOutpaint(false)}
          onSave={(outpaint, dimensions) => {
            onOutpaintChange(outpaint, dimensions)
            setIsEditingOutpaint(false)
          }}
        />
      )}
    </div>
  )
}
