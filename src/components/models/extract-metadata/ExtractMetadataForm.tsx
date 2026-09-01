import { useRef, useState } from 'react'
import { Check, Copy, ImagePlus, ImageDown, Repeat2, X } from 'lucide-react'
import { extractImageMetadata } from '../../../lib/imageMetadata'
import { parseEmbeddedJob } from '../../../lib/imageMetadata/jobMetadata'
import { findModel } from '../../../lib/models'
import { useGenerationStore, isImageGenJob, type GenerationJob } from '../../../store/generation.store'
import { SendToModelModal } from '../../SendToModelModal'

function readFileAsDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export function ExtractMetadataForm() {
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [job, setJob] = useState<GenerationJob | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File | undefined | null) {
    if (!file || !file.type.startsWith('image/')) return

    const buffer = await file.arrayBuffer()
    const text = extractImageMetadata(new Uint8Array(buffer))
    const parsedJob = text ? parseEmbeddedJob(text) : null

    setImagePreview(await readFileAsDataUri(file))
    setJob(parsedJob)
    setNotFound(!parsedJob)
  }

  function handleClear() {
    setImagePreview(null)
    setJob(null)
    setNotFound(false)
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-5">Image</label>
          {imagePreview ? (
            <div className="relative overflow-hidden rounded-md border border-neutral-70">
              <img src={imagePreview} alt="Dropped" className="max-h-64 w-full object-contain bg-input" />
              <button
                type="button"
                onClick={handleClear}
                aria-label="Clear"
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
              Drop a PNG, JPEG, or WEBP saved from this app, or click to upload
            </button>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              void handleFile(e.target.files?.[0])
              e.target.value = ''
            }}
          />
        </div>

        {notFound && (
          <p className="rounded-md border border-neutral-70 bg-input p-3 text-sm text-neutral-40">
            No generation metadata found in this image. It may have been saved from a different
            tool, edited/re-encoded since, or downloaded before this feature existed.
          </p>
        )}

        {job && imagePreview && <ExtractedJobPanel job={job} imagePreview={imagePreview} />}
      </div>
    </div>
  )
}

function ExtractedJobPanel({ job, imagePreview }: { job: GenerationJob; imagePreview: string }) {
  const remixJob = useGenerationStore((s) => s.remixJob)
  const [sendToModelOpen, setSendToModelOpen] = useState(false)

  const model = findModel(job.modelId)
  const prompt = isImageGenJob(job) ? job.positivePrompt : undefined
  const negativePrompt = isImageGenJob(job) && 'negativePrompt' in job ? job.negativePrompt : undefined
  const canRemix = isImageGenJob(job) || job.kind === 'videoInference'

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-neutral-40">
          Resources
        </p>
        <div className="rounded-md border border-neutral-70 bg-input p-3">
          <p className="text-sm font-medium text-neutral-5">{model.label}</p>
          <p className="font-mono text-xs text-neutral-40">{job.modelId}</p>
        </div>
      </div>

      {prompt && <CopyableField label="Prompt" value={prompt} />}
      {negativePrompt && <CopyableField label="Negative prompt" value={negativePrompt} />}

      <div>
        <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-neutral-40">
          Extracted metadata
        </p>
        <pre className="max-h-64 overflow-auto rounded-md border border-neutral-70 bg-input p-3 text-xs text-neutral-20">
          <code>{JSON.stringify(job, null, 2)}</code>
        </pre>
      </div>

      <div className="flex flex-col gap-1.5 border-t border-neutral-70 pt-4">
        {canRemix && (
          <>
            <ActionButton
              icon={<Repeat2 className="h-4 w-4" strokeWidth={1.75} />}
              label="Remix"
              onClick={() => remixJob(job)}
            />
            <ActionButton
              icon={<Repeat2 className="h-4 w-4" strokeWidth={1.75} />}
              label="Remix (with seed)"
              onClick={() => remixJob(job, { includeSeed: true })}
            />
          </>
        )}
        <ActionButton
          icon={<ImageDown className="h-4 w-4" strokeWidth={1.75} />}
          label="Use as input image"
          onClick={() => setSendToModelOpen(true)}
        />
      </div>

      {sendToModelOpen && (
        <SendToModelModal image={imagePreview} onClose={() => setSendToModelOpen(false)} />
      )}
    </div>
  )
}

function CopyableField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard access denied or unavailable — nothing more we can do.
    }
  }

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-40">{label}</p>
        <button
          onClick={handleCopy}
          title={`Copy ${label.toLowerCase()}`}
          aria-label={`Copy ${label.toLowerCase()}`}
          className="text-neutral-40 transition-colors hover:text-neutral-5"
        >
          {copied ? <Check className="h-3 w-3 text-brand-green-text" /> : <Copy className="h-3 w-3" />}
        </button>
      </div>
      <p className="rounded-md border border-neutral-70 bg-input p-3 text-sm text-neutral-20 break-words">
        {value}
      </p>
    </div>
  )
}

function ActionButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm text-neutral-20 transition-colors hover:bg-neutral-80"
    >
      {icon}
      {label}
    </button>
  )
}
