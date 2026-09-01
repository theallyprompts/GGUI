import { create } from 'zustand'
import { DEFAULT_MODEL, INTRODUCTION_MODEL } from '../lib/models'
import type {
  AccelerationLevel,
  AcceleratorOptions,
  CacheAcceleratorOptions,
  ImageInferenceResult,
  OutpaintSpec,
  RemoveBackgroundResult,
  RunwareLora,
  UpscaleResult,
  VideoInferenceResult,
} from '../lib/runware/types'
import { useZImageStore } from './models/zImage.store'
import { useUpscaleStore } from './models/upscale.store'
import { useMinimaxH3Store, type FrameImageEntry, type MinimaxH3InputMode } from './models/minimaxH3.store'
import { useFluxDevStore } from './models/fluxDev.store'
import { useIllustriousStore } from './models/illustrious.store'
import { useAutismmixPonyStore } from './models/autismmixPony.store'
import { useFlux2KleinStore } from './models/flux2Klein.store'
import { useSeedream45Store } from './models/seedream45.store'
import { useSd15RealisticVisionStore } from './models/sd15RealisticVision.store'
import { useSd15ChilloutmixStore } from './models/sd15Chilloutmix.store'
import { useRembgStore } from './models/rembg.store'
import { carryOverPromptState, resetModelForm } from './models/dispatch'
import { usePreferencesStore } from './preferences.store'

const STORAGE_KEY = 'runware-generator:jobs'

interface JobCommon {
  id: string
  status: 'pending' | 'success' | 'error'
  modelId: string
  createdAt: number
  /** Client-measured wall-clock time from request to response, in ms. Includes network latency. */
  elapsedMs?: number
  errorMessage?: string
  /** The exact request object sent to Runware for this job, for the "View API request" inspector. */
  apiRequest?: unknown
  /** The raw parsed response body from Runware for this job, for the "View API request" inspector. */
  apiResponse?: unknown
  starred?: boolean
}

export interface ZImageJob extends JobCommon {
  kind: 'imageInference'
  positivePrompt: string
  negativePrompt: string
  width: number
  height: number
  steps: number
  cfgScale: number
  seed: number | null
  outputFormat: 'JPG' | 'PNG' | 'WEBP'
  inputImage: string | null
  strength: number
  maskImage: string | null
  maskMargin: number
  outpaint: OutpaintSpec | null
  accelerator: AcceleratorOptions
  lora: RunwareLora[]
  result?: ImageInferenceResult
}

export interface UpscaleJob extends JobCommon {
  kind: 'upscale'
  inputImage: string
  upscaleFactor?: number
  targetMegapixels?: number
  enhanceDetails: boolean
  realism: boolean
  outputFormat: 'JPG' | 'PNG' | 'WEBP'
  outputQuality: number
  result?: UpscaleResult
}

export interface MinimaxH3Job extends JobCommon {
  kind: 'videoInference'
  positivePrompt: string
  aspectRatioLabel: string
  resolutionTierLabel: string
  width: number
  height: number
  duration: number
  seed: number | null
  outputFormat: 'MP4' | 'WEBM' | 'MOV'
  inputMode: MinimaxH3InputMode
  frameImages: FrameImageEntry[]
  referenceImages: string[]
  referenceVideos: string[]
  referenceAudios: string[]
  progress?: number
  result?: VideoInferenceResult
}

export interface FluxDevJob extends JobCommon {
  kind: 'fluxDev'
  positivePrompt: string
  negativePrompt: string
  width: number
  height: number
  steps: number
  cfgScale: number
  seed: number | null
  outputFormat: 'JPG' | 'PNG' | 'WEBP'
  inputImage: string | null
  strength: number
  maskImage: string | null
  maskMargin: number
  outpaint: OutpaintSpec | null
  accelerator: CacheAcceleratorOptions
  lora: RunwareLora[]
  result?: ImageInferenceResult
}

export interface IllustriousJob extends JobCommon {
  kind: 'illustrious'
  positivePrompt: string
  negativePrompt: string
  width: number
  height: number
  steps: number
  cfgScale: number
  seed: number | null
  outputFormat: 'JPG' | 'PNG' | 'WEBP'
  inputImage: string | null
  strength: number
  maskImage: string | null
  maskMargin: number
  outpaint: OutpaintSpec | null
  accelerator: AcceleratorOptions
  lora: RunwareLora[]
  vae: string
  result?: ImageInferenceResult
}

export interface AutismmixPonyJob extends JobCommon {
  kind: 'autismmixPony'
  positivePrompt: string
  negativePrompt: string
  width: number
  height: number
  steps: number
  cfgScale: number
  seed: number | null
  outputFormat: 'JPG' | 'PNG' | 'WEBP'
  inputImage: string | null
  strength: number
  maskImage: string | null
  maskMargin: number
  outpaint: OutpaintSpec | null
  accelerator: AcceleratorOptions
  lora: RunwareLora[]
  vae: string
  result?: ImageInferenceResult
}

export interface Flux2KleinJob extends JobCommon {
  kind: 'flux2Klein'
  /** The actually-submitted Runware model ID (9B or 4B) — distinct from `modelId`, which is always the picker entry's ID. */
  variantId: string
  positivePrompt: string
  negativePrompt: string
  width: number
  height: number
  steps: number
  cfgScale: number
  seed: number | null
  outputFormat: 'JPG' | 'PNG' | 'WEBP'
  referenceImages: string[]
  acceleration: AccelerationLevel
  lora: RunwareLora[]
  result?: ImageInferenceResult
}

export interface Seedream45Job extends JobCommon {
  kind: 'seedream45'
  positivePrompt: string
  width: number
  height: number
  seed: number | null
  outputFormat: 'JPG' | 'PNG' | 'WEBP'
  referenceImages: string[]
  result?: ImageInferenceResult
}

export interface Sd15RealisticVisionJob extends JobCommon {
  kind: 'sd15RealisticVision'
  positivePrompt: string
  negativePrompt: string
  width: number
  height: number
  steps: number
  cfgScale: number
  seed: number | null
  outputFormat: 'JPG' | 'PNG' | 'WEBP'
  inputImage: string | null
  strength: number
  maskImage: string | null
  maskMargin: number
  outpaint: OutpaintSpec | null
  lora: RunwareLora[]
  vae: string
  result?: ImageInferenceResult
}

export interface Sd15ChilloutmixJob extends JobCommon {
  kind: 'sd15Chilloutmix'
  positivePrompt: string
  negativePrompt: string
  width: number
  height: number
  steps: number
  cfgScale: number
  seed: number | null
  outputFormat: 'JPG' | 'PNG' | 'WEBP'
  inputImage: string | null
  strength: number
  maskImage: string | null
  maskMargin: number
  outpaint: OutpaintSpec | null
  lora: RunwareLora[]
  vae: string
  result?: ImageInferenceResult
}

export interface RembgJob extends JobCommon {
  kind: 'removeBackground'
  /** The actually-submitted Runware model ID (RemBG or BiRefNet) — distinct from `modelId`, which is always the picker entry's ID. */
  variantId: string
  inputImage: string
  alphaMatting: boolean
  postProcessMask: boolean
  /** Always PNG — required for a transparent background, not user-configurable. */
  outputFormat: 'PNG'
  result?: RemoveBackgroundResult
}

export type GenerationJob =
  | ZImageJob
  | UpscaleJob
  | MinimaxH3Job
  | FluxDevJob
  | IllustriousJob
  | AutismmixPonyJob
  | Flux2KleinJob
  | Seedream45Job
  | Sd15RealisticVisionJob
  | Sd15ChilloutmixJob
  | RembgJob

/** The "prompt + txt2img/img2img" job kinds that share most UI treatment (remix, prompt display, etc). */
export type ImageGenJob =
  | ZImageJob
  | FluxDevJob
  | IllustriousJob
  | AutismmixPonyJob
  | Flux2KleinJob
  | Seedream45Job
  | Sd15RealisticVisionJob
  | Sd15ChilloutmixJob

export function isImageGenJob(job: GenerationJob): job is ImageGenJob {
  return (
    job.kind === 'imageInference' ||
    job.kind === 'fluxDev' ||
    job.kind === 'illustrious' ||
    job.kind === 'autismmixPony' ||
    job.kind === 'flux2Klein' ||
    job.kind === 'seedream45' ||
    job.kind === 'sd15RealisticVision' ||
    job.kind === 'sd15Chilloutmix'
  )
}

/** Kinds whose job shape includes a `lora` array, backfilled below for records saved before
 *  LoRA support existed on that model — otherwise `job.lora.filter(...)` crashes in the detail panel. */
const LORA_JOB_KINDS = new Set([
  'imageInference',
  'fluxDev',
  'illustrious',
  'autismmixPony',
  'flux2Klein',
  'sd15RealisticVision',
  'sd15Chilloutmix',
])

function loadPersistedJobs(): GenerationJob[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const jobs = JSON.parse(raw) as Array<Partial<GenerationJob> & { status: GenerationJob['status'] }>
    // Drop in-flight jobs from a previous session — they'll never resolve.
    // Jobs persisted before `kind` existed default to the only kind that existed then.
    return jobs
      .filter((j) => j.status !== 'pending')
      .map((j) => {
        const kind = j.kind ?? 'imageInference'
        const withKind = { kind, ...j } as GenerationJob
        if (LORA_JOB_KINDS.has(kind) && !('lora' in withKind && Array.isArray(withKind.lora))) {
          return { ...withKind, lora: [] } as GenerationJob
        }
        return withKind
      })
  } catch {
    return []
  }
}

/** A placeholder standing in for a data URI that was stripped before persisting — lets the
 *  UI tell "there was an input image, but it's gone after reload" apart from "there never was
 *  one," without keeping the actual (often multi-MB) base64 payload around. */
const STRIPPED_MEDIA_PLACEHOLDER = null

/** Matches a data: URI of any media type — `data:image/png;base64,...`, `data:video/mp4;...`, etc. */
const DATA_URI_PATTERN = /^data:[^;]+;base64,/

/**
 * Recursively replaces any string value that looks like an embedded data URI with a short
 * marker, anywhere inside an arbitrary JSON-shaped value. Used for `apiRequest`/`apiResponse` —
 * `apiRequest` is the literal request object sent to Runware, so for any img2img/mask/reference
 * job it embeds the exact same base64 payload as the job's own `inputImage`/`referenceImages`
 * fields, just nested inside `inputs.seedImage`/`inputs.referenceImages`/etc. Stripping only the
 * top-level job fields (see `stripHeavyMediaForPersistence` below) left this copy behind, which
 * defeated the whole point — this walks the object generically instead of hand-listing every
 * request shape's nested field names.
 */
function stripDataUrisDeep<T>(value: T): T {
  if (typeof value === 'string') {
    return (DATA_URI_PATTERN.test(value) ? '[stripped]' : value) as T
  }
  if (Array.isArray(value)) {
    return value.map(stripDataUrisDeep) as T
  }
  if (value && typeof value === 'object') {
    const result: Record<string, unknown> = {}
    for (const [key, val] of Object.entries(value)) {
      result[key] = stripDataUrisDeep(val)
    }
    return result as T
  }
  return value
}

/**
 * Drops embedded input-image/mask/reference data URIs before writing a job to localStorage.
 * These are only needed live during generation and for Remix within the same session — once
 * persisted, they bloat every job by however large the source image was, and since the whole
 * jobs array is rewritten on every single generation, that quickly exceeds localStorage's quota
 * (mobile browsers especially). Quota failures are silently swallowed by the browser, so this
 * was manifesting as "my generations vanish after refresh" with no visible error. The job's
 * prompt/settings/result URL/cost are all still tiny strings and persist normally.
 */
function stripHeavyMediaForPersistence(job: GenerationJob): GenerationJob {
  const withStrippedApiFields = {
    ...job,
    apiRequest: stripDataUrisDeep(job.apiRequest),
    apiResponse: stripDataUrisDeep(job.apiResponse),
  }
  switch (withStrippedApiFields.kind) {
    case 'imageInference':
    case 'fluxDev':
    case 'illustrious':
    case 'autismmixPony':
    case 'sd15RealisticVision':
    case 'sd15Chilloutmix':
      return {
        ...withStrippedApiFields,
        inputImage: STRIPPED_MEDIA_PLACEHOLDER,
        maskImage: STRIPPED_MEDIA_PLACEHOLDER,
      }
    case 'upscale':
    case 'removeBackground':
      return { ...withStrippedApiFields, inputImage: '' }
    case 'flux2Klein':
    case 'seedream45':
      return { ...withStrippedApiFields, referenceImages: [] }
    case 'videoInference':
      return {
        ...withStrippedApiFields,
        frameImages: withStrippedApiFields.frameImages.map((f) => ({ ...f, image: '' })),
        referenceImages: [],
        referenceVideos: [],
        referenceAudios: [],
      }
  }
}

function persistJobs(jobs: GenerationJob[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs.map(stripHeavyMediaForPersistence)))
  } catch {
    // localStorage full or unavailable — persistence is best-effort.
  }
}

export type MobileTab = 'generator' | 'results'

/** Which content the main (results) pane shows — the Gallery (results feed / Manage Media,
 *  depending on modelId) or Prompt Studio. Toggled from the header, independent of modelId. */
export type MainView = 'gallery' | 'promptStudio'

interface GenerationState {
  modelId: string
  jobs: GenerationJob[]
  selectedJobIds: Set<string>
  /** Which pane is active on mobile's single-pane layout — irrelevant above the md breakpoint,
   *  where both panes are always visible side by side. */
  mobileTab: MobileTab
  mainView: MainView

  setModelId: (modelId: string) => void
  resetToDefault: () => void
  setMobileTab: (tab: MobileTab) => void
  setMainView: (view: MainView) => void
  addJob: (job: GenerationJob) => void
  updateJob: (id: string, patch: Partial<GenerationJob>) => void
  toggleJobSelected: (id: string) => void
  selectAllJobs: () => void
  clearSelection: () => void
  deleteSelectedJobs: () => void
  deleteJob: (id: string) => void
  toggleJobStarred: (id: string) => void
  remixJob: (job: GenerationJob, options?: { includeSeed?: boolean }) => void
}

function loadInitialModelId(): string {
  return usePreferencesStore.getState().hideIntroduction ? DEFAULT_MODEL.id : INTRODUCTION_MODEL.id
}

export const useGenerationStore = create<GenerationState>((set, get) => ({
  modelId: loadInitialModelId(),
  jobs: loadPersistedJobs(),
  selectedJobIds: new Set(),
  mobileTab: 'generator',
  mainView: 'gallery',

  setMobileTab: (tab) => set({ mobileTab: tab }),
  setMainView: (view) => set({ mainView: view, mobileTab: view === 'promptStudio' ? 'results' : get().mobileTab }),

  setModelId: (modelId) => {
    carryOverPromptState(get().modelId, modelId)
    set({
      modelId,
      mobileTab: 'generator',
      mainView: modelId === INTRODUCTION_MODEL.id ? 'gallery' : get().mainView,
    })
  },
  resetToDefault: () => {
    resetModelForm(get().modelId)
    const defaultModelId = usePreferencesStore.getState().defaultModelId
    if (defaultModelId !== get().modelId) {
      resetModelForm(defaultModelId)
      set({ modelId: defaultModelId, mobileTab: 'generator' })
    }
  },
  addJob: (job) => {
    const jobs = [job, ...get().jobs]
    set({ jobs, mobileTab: 'results', mainView: 'gallery' })
    persistJobs(jobs)
  },
  updateJob: (id, patch) => {
    const jobs = get().jobs.map((j) => (j.id === id ? ({ ...j, ...patch } as GenerationJob) : j))
    set({ jobs })
    persistJobs(jobs)
    if (patch.status === 'success') {
      const cost = (patch as { result?: { cost?: number } }).result?.cost
      if (typeof cost === 'number') usePreferencesStore.getState().addSessionSpend(cost)
    }
  },
  toggleJobSelected: (id) => {
    const selected = new Set(get().selectedJobIds)
    if (selected.has(id)) selected.delete(id)
    else selected.add(id)
    set({ selectedJobIds: selected })
  },
  selectAllJobs: () => {
    const selectable = get().jobs.filter((j) => j.status !== 'pending')
    set({ selectedJobIds: new Set(selectable.map((j) => j.id)) })
  },
  clearSelection: () => set({ selectedJobIds: new Set() }),
  deleteSelectedJobs: () => {
    const selected = get().selectedJobIds
    const jobs = get().jobs.filter((j) => !selected.has(j.id))
    set({ jobs, selectedJobIds: new Set() })
    persistJobs(jobs)
  },
  deleteJob: (id) => {
    const jobs = get().jobs.filter((j) => j.id !== id)
    set({ jobs })
    persistJobs(jobs)
  },
  toggleJobStarred: (id) => {
    const jobs = get().jobs.map((j) => (j.id === id ? { ...j, starred: !j.starred } : j))
    set({ jobs })
    persistJobs(jobs)
  },
  remixJob: (job, options) => {
    set({ modelId: job.modelId, mobileTab: 'generator' })
    if (job.kind === 'imageInference') {
      useZImageStore.getState().loadFromJob(job, options)
    } else if (job.kind === 'upscale') {
      useUpscaleStore.getState().loadFromJob(job)
    } else if (job.kind === 'videoInference') {
      useMinimaxH3Store.getState().loadFromJob(job, options)
    } else if (job.kind === 'fluxDev') {
      useFluxDevStore.getState().loadFromJob(job, options)
    } else if (job.kind === 'illustrious') {
      useIllustriousStore.getState().loadFromJob(job, options)
    } else if (job.kind === 'autismmixPony') {
      useAutismmixPonyStore.getState().loadFromJob(job, options)
    } else if (job.kind === 'flux2Klein') {
      useFlux2KleinStore.getState().loadFromJob(job, options)
    } else if (job.kind === 'seedream45') {
      useSeedream45Store.getState().loadFromJob(job, options)
    } else if (job.kind === 'sd15RealisticVision') {
      useSd15RealisticVisionStore.getState().loadFromJob(job, options)
    } else if (job.kind === 'sd15Chilloutmix') {
      useSd15ChilloutmixStore.getState().loadFromJob(job, options)
    } else {
      useRembgStore.getState().loadFromJob(job)
    }
  },
}))
