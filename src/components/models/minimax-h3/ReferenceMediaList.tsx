import { useRef, useState } from 'react'
import { FileAudio, Film, ImagePlus, Images, Pencil, X } from 'lucide-react'
import { EditImageModal } from '../../EditImageModal'
import { ImagePreviewModal } from '../../ImagePreviewModal'
import { MyMediaPickerModal } from '../../MyMediaPickerModal'

interface ReferenceMediaListProps {
  label: string
  kind: 'image' | 'video' | 'audio'
  accept: string
  value: string[]
  max: number
  disabled?: boolean
  disabledHint?: string
  onAdd: (dataUri: string) => void
  onRemove: (index: number) => void
  /** Enables the per-thumbnail edit (annotate/crop/etc.) button for kind: 'image' — omit to
   *  leave reference images edit-only-by-remove-and-re-add, as before. */
  onUpdate?: (index: number, dataUri: string) => void
}

function readFileAsDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export function ReferenceMediaList({
  label,
  kind,
  accept,
  value,
  max,
  disabled,
  disabledHint,
  onAdd,
  onRemove,
  onUpdate,
}: ReferenceMediaListProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [previewSrc, setPreviewSrc] = useState<string | null>(null)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [showMyMedia, setShowMyMedia] = useState(false)
  const atMax = value.length >= max
  const supportsMyMedia = kind === 'image' || kind === 'video'

  async function handleFiles(files: FileList | null) {
    if (!files || disabled) return
    for (const file of Array.from(files)) {
      if (value.length >= max) break
      if (!file.type.startsWith(`${kind}/`)) continue
      onAdd(await readFileAsDataUri(file))
    }
  }

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label className="text-sm font-medium text-neutral-5">{label}</label>
        <div className="flex items-center gap-2">
          {supportsMyMedia && !disabled && !atMax && (
            <button
              type="button"
              onClick={() => setShowMyMedia(true)}
              className="flex items-center gap-1 text-xs font-medium text-brand-green-text hover:underline"
            >
              <Images className="h-3 w-3" />
              Insert from My Media
            </button>
          )}
          <span className="font-mono text-xs text-neutral-40">
            {value.length}/{max}
          </span>
        </div>
      </div>

      {value.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {value.map((item, i) => (
            <div
              key={i}
              className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md border border-neutral-70 bg-input"
            >
              {kind === 'image' && (
                <button
                  type="button"
                  onClick={() => setPreviewSrc(item)}
                  className="h-full w-full cursor-zoom-in"
                  aria-label="Enlarge reference image"
                >
                  <img src={item} alt="" className="h-full w-full object-cover" />
                </button>
              )}
              {kind === 'video' && <Film className="h-5 w-5 text-neutral-40" />}
              {kind === 'audio' && <FileAudio className="h-5 w-5 text-neutral-40" />}
              <div className="absolute right-0.5 top-0.5 flex gap-0.5">
                {kind === 'image' && onUpdate && (
                  <button
                    type="button"
                    onClick={() => setEditingIndex(i)}
                    aria-label="Edit"
                    title="Edit"
                    className="rounded-md bg-neutral-90/80 p-0.5 text-neutral-5 backdrop-blur transition-colors hover:bg-neutral-90"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onRemove(i)}
                  aria-label="Remove"
                  className="rounded-md bg-neutral-90/80 p-0.5 text-neutral-5 backdrop-blur transition-colors hover:bg-neutral-90"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!atMax && !disabled && (
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
            void handleFiles(e.dataTransfer.files)
          }}
          className={`flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed px-3 py-2 text-xs text-neutral-40 transition-colors ${
            isDragging
              ? 'border-brand-green-text bg-brand-green/5'
              : 'border-neutral-70 bg-input hover:bg-neutral-80 hover:text-neutral-5'
          }`}
        >
          <ImagePlus className="h-3.5 w-3.5" />
          Add {kind}
        </button>
      )}
      {disabled && disabledHint && <p className="text-xs text-neutral-50">{disabledHint}</p>}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        className="hidden"
        onChange={(e) => {
          void handleFiles(e.target.files)
          e.target.value = ''
        }}
      />

      {previewSrc && <ImagePreviewModal src={previewSrc} onClose={() => setPreviewSrc(null)} />}

      {editingIndex !== null && (
        <EditImageModal
          image={value[editingIndex]}
          suggestedName={`Reference image ${editingIndex + 1}`}
          onClose={() => setEditingIndex(null)}
          onSave={(dataUri) => {
            onUpdate?.(editingIndex, dataUri)
            setEditingIndex(null)
          }}
        />
      )}

      {showMyMedia && (
        <MyMediaPickerModal
          kind={kind === 'video' ? 'video' : 'image'}
          onClose={() => setShowMyMedia(false)}
          onSelect={(url) => onAdd(url)}
        />
      )}
    </div>
  )
}
