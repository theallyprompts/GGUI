import { create } from 'zustand'
import { usePreferencesStore } from '../preferences.store'
import {
  FLUX_1_DEV_MODEL,
  resolveDimensions,
  findClosestAspectRatio,
  findClosestResolutionTier,
} from '../../lib/models'
import type { CacheAcceleratorOptions, OutpaintSpec, RunwareLora, Scheduler } from '../../lib/runware/types'
import type { FluxDevJob } from '../generation.store'

export const MAX_LORAS = 5

const DEFAULT_ASPECT_RATIO = FLUX_1_DEV_MODEL.aspectRatios[0]
const DEFAULT_RESOLUTION_TIER = FLUX_1_DEV_MODEL.resolutionTiers[1] // 1K

const DEFAULT_ACCELERATOR: CacheAcceleratorOptions = {
  teaCache: false,
  teaCacheDistance: 0.5,
  dbCache: false,
  dbCacheThreshold: 0.25,
  dbCacheSkipInterval: 5,
}

const initialDimensions = resolveDimensions(
  FLUX_1_DEV_MODEL,
  DEFAULT_ASPECT_RATIO.ratio,
  DEFAULT_RESOLUTION_TIER,
)

interface FluxDevState {
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
  inputImage: string | null
  strength: number
  maskImage: string | null
  maskMargin: number
  outpaint: OutpaintSpec | null
  accelerator: CacheAcceleratorOptions
  lora: RunwareLora[]

  setField: <K extends 'positivePrompt' | 'negativePrompt' | 'seed'>(
    field: K,
    value: FluxDevState[K],
  ) => void
  setAspectRatio: (label: string) => void
  setResolutionTier: (label: string) => void
  setSteps: (steps: number) => void
  setCfgScale: (cfgScale: number) => void
  setQuantity: (quantity: number) => void
  setScheduler: (scheduler: Scheduler) => void
  setOutputFormat: (format: FluxDevState['outputFormat']) => void
  setOutputQuality: (quality: number) => void
  setInputImage: (image: string | null) => void
  setStrength: (strength: number) => void
  setMaskImage: (mask: string | null) => void
  setMaskMargin: (margin: number) => void
  setOutpaint: (outpaint: OutpaintSpec | null, dimensions?: { width: number; height: number }) => void
  setAccelerator: (patch: Partial<CacheAcceleratorOptions>) => void
  addLora: () => void
  updateLora: (index: number, patch: Partial<RunwareLora>) => void
  removeLora: (index: number) => void
  loadFromJob: (job: FluxDevJob, options?: { includeSeed?: boolean }) => void
  resetForm: () => void
}

const DEFAULTS = {
  positivePrompt: '',
  negativePrompt: '',
  aspectRatioLabel: DEFAULT_ASPECT_RATIO.label,
  resolutionTierLabel: DEFAULT_RESOLUTION_TIER.label,
  width: initialDimensions.width,
  height: initialDimensions.height,
  steps: FLUX_1_DEV_MODEL.defaultSteps,
  cfgScale: FLUX_1_DEV_MODEL.defaultCFGScale,
  seed: null as number | null,
  quantity: 1,
  scheduler: 'Default' as Scheduler,
  outputFormat: usePreferencesStore.getState().preferredOutputFormat,
  outputQuality: 95,
  inputImage: null as string | null,
  strength: 0.8,
  maskImage: null as string | null,
  maskMargin: 32,
  outpaint: null as OutpaintSpec | null,
  accelerator: DEFAULT_ACCELERATOR,
  lora: [] as RunwareLora[],
}

export const useFluxDevStore = create<FluxDevState>((set, get) => ({
  ...DEFAULTS,

  setField: (field, value) => set({ [field]: value } as never),
  setAspectRatio: (label) => {
    const ratio = FLUX_1_DEV_MODEL.aspectRatios.find((r) => r.label === label) ?? FLUX_1_DEV_MODEL.aspectRatios[0]
    const tier =
      FLUX_1_DEV_MODEL.resolutionTiers.find((t) => t.label === get().resolutionTierLabel) ??
      FLUX_1_DEV_MODEL.resolutionTiers[0]
    const { width, height } = resolveDimensions(FLUX_1_DEV_MODEL, ratio.ratio, tier)
    set({ aspectRatioLabel: label, width, height })
  },
  setResolutionTier: (label) => {
    const tier = FLUX_1_DEV_MODEL.resolutionTiers.find((t) => t.label === label) ?? FLUX_1_DEV_MODEL.resolutionTiers[0]
    const ratio =
      FLUX_1_DEV_MODEL.aspectRatios.find((r) => r.label === get().aspectRatioLabel) ?? FLUX_1_DEV_MODEL.aspectRatios[0]
    const { width, height } = resolveDimensions(FLUX_1_DEV_MODEL, ratio.ratio, tier)
    set({ resolutionTierLabel: label, width, height })
  },
  setSteps: (steps) => set({ steps }),
  setCfgScale: (cfgScale) => set({ cfgScale }),
  setQuantity: (quantity) => set({ quantity: Math.min(20, Math.max(1, quantity)) }),
  setScheduler: (scheduler) => set({ scheduler }),
  setOutputFormat: (outputFormat) => set({ outputFormat }),
  setOutputQuality: (outputQuality) => set({ outputQuality }),
  setInputImage: (inputImage) => set({ inputImage, maskImage: null, outpaint: null }),
  setStrength: (strength) => set({ strength: Math.min(1, Math.max(0, strength)) }),
  setMaskImage: (maskImage) => set({ maskImage }),
  setMaskMargin: (maskMargin) => set({ maskMargin: Math.min(128, Math.max(32, maskMargin)) }),
  setOutpaint: (outpaint, dimensions) =>
    set(dimensions ? { outpaint, width: dimensions.width, height: dimensions.height } : { outpaint }),
  setAccelerator: (patch) => set({ accelerator: { ...get().accelerator, ...patch } }),
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
    const ratio = findClosestAspectRatio(FLUX_1_DEV_MODEL, job.width, job.height)
    const tier = findClosestResolutionTier(FLUX_1_DEV_MODEL, job.width, job.height)
    set({
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
      inputImage: job.inputImage,
      strength: job.strength,
      maskImage: job.maskImage,
      maskMargin: job.maskMargin,
      outpaint: job.outpaint,
      accelerator: job.accelerator,
      lora: job.lora,
    })
  },
  resetForm: () => set(DEFAULTS),
}))
