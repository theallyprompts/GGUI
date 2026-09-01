import { create } from 'zustand'
import { usePreferencesStore } from '../preferences.store'
import {
  FLUX_2_KLEIN_MODEL,
  FLUX_2_KLEIN_9B_ID,
  resolveDimensions,
  findClosestAspectRatio,
  findClosestResolutionTier,
} from '../../lib/models'
import type { AccelerationLevel, RunwareLora, Scheduler } from '../../lib/runware/types'
import type { Flux2KleinJob } from '../generation.store'

export const MAX_LORAS = 5

const DEFAULT_ASPECT_RATIO = FLUX_2_KLEIN_MODEL.aspectRatios[0]
const DEFAULT_RESOLUTION_TIER = FLUX_2_KLEIN_MODEL.resolutionTiers[1] // 1K

const initialDimensions = resolveDimensions(
  FLUX_2_KLEIN_MODEL,
  DEFAULT_ASPECT_RATIO.ratio,
  DEFAULT_RESOLUTION_TIER,
)

interface Flux2KleinState {
  variantId: string
  positivePrompt: string
  negativePrompt: string
  aspectRatioLabel: string
  resolutionTierLabel: string
  width: number
  height: number
  steps: number
  cfgScale: number
  seed: number | null
  quantity: number
  scheduler: Scheduler
  outputFormat: 'JPG' | 'PNG' | 'WEBP'
  outputQuality: number
  referenceImages: string[]
  acceleration: AccelerationLevel
  lora: RunwareLora[]

  setVariantId: (variantId: string) => void
  setField: <K extends 'positivePrompt' | 'negativePrompt' | 'seed'>(
    field: K,
    value: Flux2KleinState[K],
  ) => void
  setAspectRatio: (label: string) => void
  setResolutionTier: (label: string) => void
  setSteps: (steps: number) => void
  setCfgScale: (cfgScale: number) => void
  setQuantity: (quantity: number) => void
  setScheduler: (scheduler: Scheduler) => void
  setOutputFormat: (format: Flux2KleinState['outputFormat']) => void
  setOutputQuality: (quality: number) => void
  addReferenceImage: (image: string) => void
  removeReferenceImage: (index: number) => void
  setAcceleration: (level: AccelerationLevel) => void
  addLora: () => void
  updateLora: (index: number, patch: Partial<RunwareLora>) => void
  removeLora: (index: number) => void
  loadFromJob: (job: Flux2KleinJob, options?: { includeSeed?: boolean }) => void
  resetForm: () => void
}

const DEFAULTS = {
  variantId: FLUX_2_KLEIN_9B_ID,
  positivePrompt: '',
  negativePrompt: '',
  aspectRatioLabel: DEFAULT_ASPECT_RATIO.label,
  resolutionTierLabel: DEFAULT_RESOLUTION_TIER.label,
  width: initialDimensions.width,
  height: initialDimensions.height,
  steps: FLUX_2_KLEIN_MODEL.defaultSteps,
  cfgScale: FLUX_2_KLEIN_MODEL.defaultCFGScale,
  seed: null as number | null,
  quantity: 1,
  scheduler: 'Default' as Scheduler,
  outputFormat: usePreferencesStore.getState().preferredOutputFormat,
  outputQuality: 95,
  referenceImages: [] as string[],
  acceleration: 'high' as AccelerationLevel,
  lora: [] as RunwareLora[],
}

export const useFlux2KleinStore = create<Flux2KleinState>((set, get) => ({
  ...DEFAULTS,

  setVariantId: (variantId) => set({ variantId }),
  setField: (field, value) => set({ [field]: value } as never),
  setAspectRatio: (label) => {
    const ratio =
      FLUX_2_KLEIN_MODEL.aspectRatios.find((r) => r.label === label) ?? FLUX_2_KLEIN_MODEL.aspectRatios[0]
    const tier =
      FLUX_2_KLEIN_MODEL.resolutionTiers.find((t) => t.label === get().resolutionTierLabel) ??
      FLUX_2_KLEIN_MODEL.resolutionTiers[0]
    const { width, height } = resolveDimensions(FLUX_2_KLEIN_MODEL, ratio.ratio, tier)
    set({ aspectRatioLabel: label, width, height })
  },
  setResolutionTier: (label) => {
    const tier =
      FLUX_2_KLEIN_MODEL.resolutionTiers.find((t) => t.label === label) ?? FLUX_2_KLEIN_MODEL.resolutionTiers[0]
    const ratio =
      FLUX_2_KLEIN_MODEL.aspectRatios.find((r) => r.label === get().aspectRatioLabel) ??
      FLUX_2_KLEIN_MODEL.aspectRatios[0]
    const { width, height } = resolveDimensions(FLUX_2_KLEIN_MODEL, ratio.ratio, tier)
    set({ resolutionTierLabel: label, width, height })
  },
  setSteps: (steps) => set({ steps }),
  setCfgScale: (cfgScale) => set({ cfgScale }),
  setQuantity: (quantity) => set({ quantity: Math.min(20, Math.max(1, quantity)) }),
  setScheduler: (scheduler) => set({ scheduler }),
  setOutputFormat: (outputFormat) => set({ outputFormat }),
  setOutputQuality: (outputQuality) => set({ outputQuality }),
  addReferenceImage: (image) => {
    const referenceImages = get().referenceImages
    if (referenceImages.length >= (FLUX_2_KLEIN_MODEL.maxReferenceImages ?? 4)) return
    set({ referenceImages: [...referenceImages, image] })
  },
  removeReferenceImage: (index) => {
    set({ referenceImages: get().referenceImages.filter((_, i) => i !== index) })
  },
  setAcceleration: (acceleration) => set({ acceleration }),
  addLora: () => {
    const lora = get().lora
    if (lora.length >= MAX_LORAS) return
    set({ lora: [...lora, { model: '', weight: 1 }] })
  },
  updateLora: (index, patch) => {
    set({ lora: get().lora.map((l, i) => (i === index ? { ...l, ...patch } : l)) })
  },
  removeLora: (index) => {
    set({ lora: get().lora.filter((_, i) => i !== index) })
  },
  loadFromJob: (job, options) => {
    const ratio = findClosestAspectRatio(FLUX_2_KLEIN_MODEL, job.width, job.height)
    const tier = findClosestResolutionTier(FLUX_2_KLEIN_MODEL, job.width, job.height)
    set({
      variantId: job.variantId,
      positivePrompt: job.positivePrompt,
      negativePrompt: job.negativePrompt,
      aspectRatioLabel: ratio.label,
      resolutionTierLabel: tier.label,
      width: job.width,
      height: job.height,
      steps: job.steps,
      cfgScale: job.cfgScale,
      seed: options?.includeSeed ? job.result?.seed ?? job.seed : null,
      outputFormat: job.outputFormat,
      referenceImages: job.referenceImages,
      acceleration: job.acceleration,
      lora: job.lora,
    })
  },
  resetForm: () => set(DEFAULTS),
}))
