import { useEffect, useState } from 'react'
import {
  ArrowUpToLine,
  BookText,
  Check,
  Code,
  Copy,
  Download,
  Eraser,
  ExternalLink,
  FolderPlus,
  ImageDown,
  Info,
  Pencil,
  Repeat2,
  Star,
  Trash2,
  X,
} from 'lucide-react'
import {
  useGenerationStore,
  isImageGenJob,
  type GenerationJob,
  type ZImageJob,
  type FluxDevJob,
  type IllustriousJob,
  type AutismmixPonyJob,
  type Flux2KleinJob,
  type Seedream45Job,
  type Sd15RealisticVisionJob,
  type Sd15ChilloutmixJob,
  type UpscaleJob,
  type MinimaxH3Job,
  type RembgJob,
} from '../store/generation.store'
import { useUpscaleStore } from '../store/models/upscale.store'
import { useRembgStore } from '../store/models/rembg.store'
import { useMyMediaStore } from '../store/myMedia.store'
import { useApiKeyStore } from '../store/apiKey.store'
import { setInputImageForModel, isMinimaxH3Model, setMinimaxH3Input } from '../store/models/dispatch'
import { UPSCALE_MODEL, REMBG_MODEL, MANAGE_MEDIA_MODEL, FLUX_2_KLEIN_MODEL, findModel } from '../lib/models'
import { UseAsInputModal } from './models/minimax-h3/UseAsInputModal'
import { ApiRequestModal } from './ApiRequestModal'
import { EditImageModal } from './EditImageModal'
import { PromptEntryEditorModal, type PromptEntryInitialDraft } from './PromptEntryEditorModal'
import { embedImageMetadata } from '../lib/imageMetadata'
import { serializeJobMetadata } from '../lib/imageMetadata/jobMetadata'

interface LightboxProps {
  job: GenerationJob
  onClose: () => void
  onPrev?: () => void
  onNext?: () => void
}

function extensionFor(format: GenerationJob['outputFormat']): string {
  return format === 'JPG' ? 'jpg' : format.toLowerCase()
}

function mediaUrlFor(job: GenerationJob): string | undefined {
  return job.kind === 'videoInference' ? job.result?.videoURL : job.result?.imageURL
}

async function urlToDataUri(url: string): Promise<string> {
  const res = await fetch(url)
  const blob = await res.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

export function Lightbox({ job, onClose, onPrev, onNext }: LightboxProps) {
  const [showDetails, setShowDetails] = useState(false)
  const toggleJobStarred = useGenerationStore((s) => s.toggleJobStarred)

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (showDetails) setShowDetails(false)
        else onClose()
      } else if (e.key === 'ArrowLeft') onPrev?.()
      else if (e.key === 'ArrowRight') onNext?.()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, onPrev, onNext, showDetails])

  const mediaUrl = mediaUrlFor(job)
  const isVideo = job.kind === 'videoInference'
  const altText = isImageGenJob(job)
    ? job.positivePrompt
    : job.kind === 'removeBackground'
      ? 'Background removed'
      : 'Upscaled image'

  return (
    <div className="fixed inset-0 z-50 flex bg-black/90" onClick={onClose}>
      <div className="relative flex flex-1 items-center justify-center p-4">
        <button
          onClick={(e) => {
            e.stopPropagation()
            setShowDetails(true)
          }}
          className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100/60 text-neutral-5 hover:bg-neutral-100/90 md:hidden"
          aria-label="Show generation details"
        >
          <Info className="h-4 w-4" />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation()
            toggleJobStarred(job.id)
          }}
          title={job.starred ? 'Unstar' : 'Star'}
          aria-label={job.starred ? 'Unstar' : 'Star'}
          className="absolute right-16 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100/60 text-neutral-5 hover:bg-neutral-100/90"
        >
          <Star className={`h-4 w-4 ${job.starred ? 'fill-brand-yellow text-brand-yellow' : ''}`} strokeWidth={1.75} />
        </button>

        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-2xl leading-none text-neutral-40 hover:text-neutral-5"
          aria-label="Close"
        >
          ✕
        </button>

        {onPrev && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onPrev()
            }}
            className="absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-neutral-100/60 text-neutral-5 hover:bg-neutral-100/90"
            aria-label="Previous image"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="m15 18-6-6 6-6" />
            </svg>
          </button>
        )}

        {mediaUrl && isVideo && (
          <video
            src={mediaUrl}
            controls
            autoPlay
            loop
            onClick={(e) => e.stopPropagation()}
            className="max-h-full max-w-full rounded-lg object-contain"
          />
        )}
        {mediaUrl && !isVideo && (
          <img
            src={mediaUrl}
            alt={altText}
            onClick={(e) => e.stopPropagation()}
            className="max-h-full max-w-full rounded-lg object-contain"
          />
        )}

        {onNext && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onNext()
            }}
            className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-neutral-100/60 text-neutral-5 hover:bg-neutral-100/90"
            aria-label="Next image"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="m9 18 6-6-6-6" />
            </svg>
          </button>
        )}
      </div>

      {showDetails && (
        <div
          onClick={() => setShowDetails(false)}
          className="fixed inset-0 z-10 bg-black/50 md:hidden"
        />
      )}

      <div
        onClick={(e) => e.stopPropagation()}
        className={`fixed inset-y-0 right-0 z-20 w-80 max-w-[85vw] overflow-y-auto border-l border-neutral-70 bg-card p-4 transition-transform md:static md:z-auto md:max-w-none md:translate-x-0 md:shrink-0 ${
          showDetails ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <button
          onClick={() => setShowDetails(false)}
          className="mb-3 flex items-center gap-1.5 text-xs font-medium text-neutral-40 hover:text-neutral-20 md:hidden"
        >
          <X className="h-3.5 w-3.5" />
          Close details
        </button>

        {(job.kind === 'imageInference' ||
          job.kind === 'fluxDev' ||
          job.kind === 'illustrious' ||
          job.kind === 'autismmixPony' ||
          job.kind === 'sd15RealisticVision' ||
          job.kind === 'sd15Chilloutmix') && <ImageGenDetailPanel job={job} />}
        {job.kind === 'flux2Klein' && <Flux2KleinDetailPanel job={job} />}
        {job.kind === 'seedream45' && <Seedream45DetailPanel job={job} />}
        {job.kind === 'upscale' && <UpscaleDetailPanel job={job} />}
        {job.kind === 'videoInference' && <MinimaxH3DetailPanel job={job} />}
        {job.kind === 'removeBackground' && <RembgDetailPanel job={job} />}

        <ActionButtons job={job} onClose={onClose} />
      </div>
    </div>
  )
}

function ActionButtons({ job, onClose }: { job: GenerationJob; onClose: () => void }) {
  const remixJob = useGenerationStore((s) => s.remixJob)
  const deleteJob = useGenerationStore((s) => s.deleteJob)
  const activeModelId = useGenerationStore((s) => s.modelId)
  const setModelId = useGenerationStore((s) => s.setModelId)
  const setUpscaleInputImage = useUpscaleStore((s) => s.setInputImage)
  const setRembgInputImage = useRembgStore((s) => s.setInputImage)
  const setPendingUpload = useMyMediaStore((s) => s.setPendingUpload)
  const uploadNewMedia = useMyMediaStore((s) => s.uploadNew)
  const apiKey = useApiKeyStore((s) => s.apiKey)
  const [minimaxTarget, setMinimaxTarget] = useState<string | null>(null)
  const [showApiRequest, setShowApiRequest] = useState(false)
  const [showEditImage, setShowEditImage] = useState(false)
  const [promptStudioDraft, setPromptStudioDraft] = useState<PromptEntryInitialDraft | null>(null)
  const [isSavingToPromptStudio, setIsSavingToPromptStudio] = useState(false)

  const mediaUrl = mediaUrlFor(job)
  const isVideo = job.kind === 'videoInference'
  if (!mediaUrl) return null

  function handleEditedDownload(dataUri: string) {
    const a = document.createElement('a')
    a.href = dataUri
    a.download = `runware-${job.id}-edited.png`
    a.click()
  }

  function handleEditedSaveAsCopy(dataUri: string) {
    setPendingUpload({ name: `runware-${job.id}-edited.png`, dataUri })
    setModelId(MANAGE_MEDIA_MODEL.id)
    setShowEditImage(false)
    onClose()
  }

  function handleEditedUseAsInput(dataUri: string) {
    if (isMinimaxH3Model(activeModelId)) {
      setMinimaxTarget(dataUri)
    } else {
      setInputImageForModel(activeModelId, dataUri)
      onClose()
    }
    setShowEditImage(false)
  }

  function handleEditedSendToUpscale(dataUri: string) {
    setUpscaleInputImage(dataUri)
    setModelId(UPSCALE_MODEL.id)
    setShowEditImage(false)
    onClose()
  }

  function handleEditedSendToRemoveBackground(dataUri: string) {
    setRembgInputImage(dataUri)
    setModelId(REMBG_MODEL.id)
    setShowEditImage(false)
    onClose()
  }

  async function handleUseAsInput() {
    const dataUri = await urlToDataUri(mediaUrl!)
    if (isMinimaxH3Model(activeModelId)) {
      setMinimaxTarget(dataUri)
    } else {
      setInputImageForModel(activeModelId, dataUri)
      onClose()
    }
  }

  async function handleUpscale() {
    const dataUri = await urlToDataUri(mediaUrl!)
    setUpscaleInputImage(dataUri)
    setModelId(UPSCALE_MODEL.id)
    onClose()
  }

  async function handleRemoveBackground() {
    const dataUri = await urlToDataUri(mediaUrl!)
    setRembgInputImage(dataUri)
    setModelId(REMBG_MODEL.id)
    onClose()
  }

  async function handleAddToMyMedia() {
    const dataUri = await urlToDataUri(mediaUrl!)
    setPendingUpload({ name: `runware-${job.id}.${extensionFor(job.outputFormat)}`, dataUri })
    setModelId(MANAGE_MEDIA_MODEL.id)
    onClose()
  }

  async function handleAddToPromptStudio() {
    if (!apiKey || !isImageGenJob(job)) return
    setIsSavingToPromptStudio(true)
    try {
      const dataUri = await urlToDataUri(mediaUrl!)
      const mediaUUID = await uploadNewMedia(apiKey, `runware-${job.id}.${extensionFor(job.outputFormat)}`, dataUri)
      const model = findModel(job.modelId)
      setPromptStudioDraft({
        title: job.positivePrompt.slice(0, 40),
        positiveText: job.positivePrompt,
        negativeText: 'negativePrompt' in job ? job.negativePrompt : '',
        ecosystem: model.ecosystem ?? null,
        modelId: job.modelId,
        lora: 'lora' in job ? job.lora : [],
        exampleMediaUUIDs: mediaUUID ? [mediaUUID] : [],
      })
    } finally {
      setIsSavingToPromptStudio(false)
    }
  }

  async function handleDownload() {
    try {
      const res = await fetch(mediaUrl!)
      const buffer = await res.arrayBuffer()
      const bytes = isVideo
        ? new Uint8Array(buffer)
        : embedImageMetadata(new Uint8Array(buffer), serializeJobMetadata(job))
      const blob = new Blob([bytes.slice()])
      const objectUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = objectUrl
      a.download = `runware-${job.id}.${extensionFor(job.outputFormat)}`
      a.click()
      URL.revokeObjectURL(objectUrl)
    } catch {
      window.open(mediaUrl, '_blank')
    }
  }

  return (
    <div className="mt-4 flex flex-col gap-1.5 border-t border-neutral-70 pt-4">
      {(isImageGenJob(job) || job.kind === 'videoInference') && (
        <>
          <ActionButton
            icon={<Repeat2 className="h-4 w-4" strokeWidth={1.75} />}
            label="Remix"
            onClick={() => {
              remixJob(job)
              onClose()
            }}
          />
          <ActionButton
            icon={<Repeat2 className="h-4 w-4" strokeWidth={1.75} />}
            label="Remix (with seed)"
            onClick={() => {
              remixJob(job, { includeSeed: true })
              onClose()
            }}
          />
        </>
      )}
      {!isVideo && (
        <>
          <ActionButton
            icon={<Pencil className="h-4 w-4" strokeWidth={1.75} />}
            label="Edit image"
            onClick={() => setShowEditImage(true)}
          />
          <ActionButton
            icon={<ArrowUpToLine className="h-4 w-4" strokeWidth={1.75} />}
            label="Upscale"
            onClick={() => void handleUpscale()}
          />
          <ActionButton
            icon={<Eraser className="h-4 w-4" strokeWidth={1.75} />}
            label="Remove background"
            onClick={() => void handleRemoveBackground()}
          />
          <ActionButton
            icon={<ImageDown className="h-4 w-4" strokeWidth={1.75} />}
            label="Use as input image"
            onClick={() => void handleUseAsInput()}
          />
        </>
      )}
      <ActionButton
        icon={<Download className="h-4 w-4" strokeWidth={1.75} />}
        label="Download"
        onClick={() => void handleDownload()}
      />
      <ActionButton
        icon={<FolderPlus className="h-4 w-4" strokeWidth={1.75} />}
        label="Add to My Media"
        onClick={() => void handleAddToMyMedia()}
      />
      {isImageGenJob(job) && (
        <ActionButton
          icon={<BookText className="h-4 w-4" strokeWidth={1.75} />}
          label={isSavingToPromptStudio ? 'Uploading…' : 'Add to Prompt Studio'}
          onClick={() => void handleAddToPromptStudio()}
        />
      )}
      <ActionButton
        icon={<ExternalLink className="h-4 w-4" strokeWidth={1.75} />}
        label="Open in new tab"
        onClick={() => window.open(mediaUrl, '_blank', 'noopener,noreferrer')}
      />
      <ActionButton
        icon={<Code className="h-4 w-4" strokeWidth={1.75} />}
        label="View API request"
        onClick={() => setShowApiRequest(true)}
      />
      <ActionButton
        icon={<Trash2 className="h-4 w-4" strokeWidth={1.75} />}
        label="Delete"
        destructive
        onClick={() => {
          if (confirm('Delete this generation?')) {
            deleteJob(job.id)
            onClose()
          }
        }}
      />

      {minimaxTarget && (
        <UseAsInputModal
          image={minimaxTarget}
          onClose={() => setMinimaxTarget(null)}
          onSelect={(target) => {
            setMinimaxH3Input(minimaxTarget, target)
            setMinimaxTarget(null)
            onClose()
          }}
        />
      )}

      {showApiRequest && (
        <ApiRequestModal
          request={job.apiRequest}
          response={job.apiResponse}
          onClose={() => setShowApiRequest(false)}
        />
      )}

      {showEditImage && (
        <EditImageModal
          image={mediaUrl}
          suggestedName={`runware-${job.id}-edited.png`}
          onClose={() => setShowEditImage(false)}
          onDownload={handleEditedDownload}
          onSaveAsCopy={handleEditedSaveAsCopy}
          onUseAsInput={handleEditedUseAsInput}
          onSendToUpscale={handleEditedSendToUpscale}
          onSendToRemoveBackground={handleEditedSendToRemoveBackground}
        />
      )}

      {promptStudioDraft && (
        <PromptEntryEditorModal
          entry={null}
          initialDraft={promptStudioDraft}
          onClose={() => setPromptStudioDraft(null)}
        />
      )}
    </div>
  )
}

function ActionButton({
  icon,
  label,
  onClick,
  destructive,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  destructive?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors hover:bg-neutral-80 ${
        destructive ? 'text-brand-destructive' : 'text-neutral-20'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}

function ImageGenDetailPanel({
  job,
}: {
  job:
    | ZImageJob
    | FluxDevJob
    | IllustriousJob
    | AutismmixPonyJob
    | Sd15RealisticVisionJob
    | Sd15ChilloutmixJob
}) {
  const hasFbCache = 'accelerator' in job && 'fbCache' in job.accelerator && job.accelerator.fbCache
  const hasAccelerator =
    'accelerator' in job && Boolean(hasFbCache || job.accelerator.teaCache || job.accelerator.dbCache)
  const validLora = job.lora.filter((l) => l.model.trim().length > 0)

  return (
    <>
      <h2 className="mb-3 text-sm font-semibold text-neutral-5">Generation details</h2>

      <DetailField label="Prompt" value={job.positivePrompt} />
      {job.negativePrompt && <DetailField label="Negative prompt" value={job.negativePrompt} />}

      <div className="mt-3 grid grid-cols-2 gap-3">
        <DetailStat label="Dimensions" value={`${job.width}×${job.height}`} />
        <DetailStat label="Steps" value={String(job.steps)} />
        <DetailStat label="CFG scale" value={String(job.cfgScale)} />
        <DetailStat
          label="Seed"
          value={
            job.seed !== null
              ? String(job.seed)
              : job.result?.seed !== undefined
                ? String(job.result.seed)
                : 'Random'
          }
        />
        {job.result?.cost !== undefined && (
          <DetailStat label="Cost" value={`$${job.result.cost.toFixed(4)}`} accent />
        )}
        {job.elapsedMs !== undefined && (
          <DetailStat label="Time" value={`${(job.elapsedMs / 1000).toFixed(1)}s`} />
        )}
      </div>

      {job.inputImage && (
        <div className="mt-3 grid grid-cols-2 gap-3">
          <DetailStat label="Denoise" value={String(job.strength)} />
          {job.maskImage && <DetailStat label="Mask margin" value={`${job.maskMargin}px`} />}
          {job.outpaint && <DetailStat label="Outpaint" value="Canvas extended" />}
        </div>
      )}

      {'vae' in job && job.vae && (
        <div className="mt-3">
          <DetailField label="VAE" value={job.vae} />
        </div>
      )}

      {validLora.length > 0 && (
        <div className="mt-3">
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-neutral-40">LoRA</p>
          <div className="flex flex-col gap-1">
            {validLora.map((l, i) => (
              <p key={i} className="truncate font-mono text-sm text-neutral-20">
                {l.model} <span className="text-neutral-40">({l.weight ?? 1})</span>
              </p>
            ))}
          </div>
        </div>
      )}

      {hasAccelerator && 'accelerator' in job && (
        <div className="mt-3">
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-neutral-40">
            Accelerator
          </p>
          <div className="flex flex-col gap-1 text-sm text-neutral-20">
            {hasFbCache && (
              <p>
                First Block Cache (
                {'fbCacheThreshold' in job.accelerator ? job.accelerator.fbCacheThreshold ?? 0.25 : 0.25})
              </p>
            )}
            {job.accelerator.teaCache && <p>TeaCache ({job.accelerator.teaCacheDistance ?? 0.5})</p>}
            {job.accelerator.dbCache && <p>DB Cache ({job.accelerator.dbCacheThreshold ?? 0.25})</p>}
          </div>
        </div>
      )}
    </>
  )
}

function Flux2KleinDetailPanel({ job }: { job: Flux2KleinJob }) {
  const validLora = job.lora.filter((l) => l.model.trim().length > 0)
  const variantLabel =
    FLUX_2_KLEIN_MODEL.variants?.find((v) => v.id === job.variantId)?.label ?? job.variantId

  return (
    <>
      <h2 className="mb-3 text-sm font-semibold text-neutral-5">Generation details</h2>

      <DetailField label="Prompt" value={job.positivePrompt} />
      {job.negativePrompt && <DetailField label="Negative prompt" value={job.negativePrompt} />}

      <div className="mt-3 grid grid-cols-2 gap-3">
        <DetailStat label="Variant" value={variantLabel} />
        <DetailStat label="Dimensions" value={`${job.width}×${job.height}`} />
        <DetailStat label="Steps" value={String(job.steps)} />
        <DetailStat label="CFG scale" value={String(job.cfgScale)} />
        <DetailStat
          label="Seed"
          value={
            job.seed !== null
              ? String(job.seed)
              : job.result?.seed !== undefined
                ? String(job.result.seed)
                : 'Random'
          }
        />
        <DetailStat label="Acceleration" value={job.acceleration} />
        {job.result?.cost !== undefined && (
          <DetailStat label="Cost" value={`$${job.result.cost.toFixed(4)}`} accent />
        )}
        {job.elapsedMs !== undefined && (
          <DetailStat label="Time" value={`${(job.elapsedMs / 1000).toFixed(1)}s`} />
        )}
      </div>

      {job.referenceImages.length > 0 && (
        <div className="mt-3">
          <DetailStat label="Reference images" value={String(job.referenceImages.length)} />
        </div>
      )}

      {validLora.length > 0 && (
        <div className="mt-3">
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-neutral-40">LoRA</p>
          <div className="flex flex-col gap-1">
            {validLora.map((l, i) => (
              <p key={i} className="truncate font-mono text-sm text-neutral-20">
                {l.model} <span className="text-neutral-40">({l.weight ?? 1})</span>
              </p>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

function Seedream45DetailPanel({ job }: { job: Seedream45Job }) {
  return (
    <>
      <h2 className="mb-3 text-sm font-semibold text-neutral-5">Generation details</h2>

      <DetailField label="Prompt" value={job.positivePrompt} />

      <div className="mt-3 grid grid-cols-2 gap-3">
        <DetailStat label="Dimensions" value={`${job.width}×${job.height}`} />
        <DetailStat
          label="Seed"
          value={
            job.seed !== null
              ? String(job.seed)
              : job.result?.seed !== undefined
                ? String(job.result.seed)
                : 'Random'
          }
        />
        {job.result?.cost !== undefined && (
          <DetailStat label="Cost" value={`$${job.result.cost.toFixed(4)}`} accent />
        )}
        {job.elapsedMs !== undefined && (
          <DetailStat label="Time" value={`${(job.elapsedMs / 1000).toFixed(1)}s`} />
        )}
      </div>

      {job.referenceImages.length > 0 && (
        <div className="mt-3">
          <DetailStat label="Reference images" value={String(job.referenceImages.length)} />
        </div>
      )}
    </>
  )
}

function UpscaleDetailPanel({ job }: { job: UpscaleJob }) {
  return (
    <>
      <h2 className="mb-3 text-sm font-semibold text-neutral-5">Upscale details</h2>

      <div className="grid grid-cols-2 gap-3">
        {job.upscaleFactor !== undefined && (
          <DetailStat label="Upscale factor" value={`${job.upscaleFactor}×`} />
        )}
        {job.targetMegapixels !== undefined && (
          <DetailStat label="Target" value={`${job.targetMegapixels} MP`} />
        )}
        <DetailStat label="Enhance details" value={job.enhanceDetails ? 'On' : 'Off'} />
        <DetailStat label="Realism" value={job.realism ? 'On' : 'Off'} />
        {job.result?.cost !== undefined && (
          <DetailStat label="Cost" value={`$${job.result.cost.toFixed(4)}`} accent />
        )}
        {job.elapsedMs !== undefined && (
          <DetailStat label="Time" value={`${(job.elapsedMs / 1000).toFixed(1)}s`} />
        )}
      </div>
    </>
  )
}

function RembgDetailPanel({ job }: { job: RembgJob }) {
  const variant = REMBG_MODEL.variants?.find((v) => v.id === job.variantId)

  return (
    <>
      <h2 className="mb-3 text-sm font-semibold text-neutral-5">Background removal details</h2>

      <div className="grid grid-cols-2 gap-3">
        {variant && <DetailStat label="Variant" value={variant.label} />}
        {variant?.supportsSettings && (
          <>
            <DetailStat label="Alpha matting" value={job.alphaMatting ? 'On' : 'Off'} />
            <DetailStat label="Post-process mask" value={job.postProcessMask ? 'On' : 'Off'} />
          </>
        )}
        {job.result?.cost !== undefined && (
          <DetailStat label="Cost" value={`$${job.result.cost.toFixed(4)}`} accent />
        )}
        {job.elapsedMs !== undefined && (
          <DetailStat label="Time" value={`${(job.elapsedMs / 1000).toFixed(1)}s`} />
        )}
      </div>
    </>
  )
}

function MinimaxH3DetailPanel({ job }: { job: MinimaxH3Job }) {
  return (
    <>
      <h2 className="mb-3 text-sm font-semibold text-neutral-5">Generation details</h2>

      <DetailField label="Prompt" value={job.positivePrompt} />

      <div className="mt-3 grid grid-cols-2 gap-3">
        <DetailStat label="Dimensions" value={`${job.width}×${job.height}`} />
        <DetailStat label="Duration" value={`${job.duration}s`} />
        <DetailStat
          label="Seed"
          value={
            job.seed !== null
              ? String(job.seed)
              : job.result?.seed !== undefined
                ? String(job.result.seed)
                : 'Random'
          }
        />
        {job.result?.cost !== undefined && (
          <DetailStat label="Cost" value={`$${job.result.cost.toFixed(4)}`} accent />
        )}
        {job.elapsedMs !== undefined && (
          <DetailStat label="Time" value={`${(job.elapsedMs / 1000).toFixed(1)}s`} />
        )}
      </div>

      {job.inputMode === 'frames' && job.frameImages.length > 0 && (
        <div className="mt-3">
          <DetailStat label="Frame images" value={String(job.frameImages.length)} />
        </div>
      )}
      {job.inputMode === 'references' && (
        <div className="mt-3 grid grid-cols-3 gap-3">
          {job.referenceImages.length > 0 && (
            <DetailStat label="Ref. images" value={String(job.referenceImages.length)} />
          )}
          {job.referenceVideos.length > 0 && (
            <DetailStat label="Ref. videos" value={String(job.referenceVideos.length)} />
          )}
          {job.referenceAudios.length > 0 && (
            <DetailStat label="Ref. audio" value={String(job.referenceAudios.length)} />
          )}
        </div>
      )}
    </>
  )
}

function DetailField({ label, value }: { label: string; value: string }) {
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
    <div className="mb-3">
      <div className="mb-1 flex items-center gap-1.5">
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
      <p className="text-sm text-neutral-20 break-words">{value}</p>
    </div>
  )
}

function DetailStat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p className="mb-0.5 text-xs font-medium uppercase tracking-wide text-neutral-40">{label}</p>
      <p className={`font-mono text-sm ${accent ? 'text-brand-green-text' : 'text-neutral-20'}`}>{value}</p>
    </div>
  )
}
