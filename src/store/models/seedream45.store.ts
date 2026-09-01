import { create } from 'zustand'
import { usePreferencesStore } from '../preferences.store'
import {
  SEEDREAM_4_5_MODEL,
  resolveDimensions,
  findClosestAspectRatio,
  findClosestResolutionTier,
} from '../../lib/models'
import type { Seedream45Job } from '../generation.store'

const DEFAULT_ASPECT_RATIO = SEEDREAM_4_5_MODEL.aspectRatios[0]
const DEFAULT_RESOLUTION_TIER = SEEDREAM_4_5_MODEL.resolutionTiers[0] // 2K

const initialDimensions = resolveDimensions(
  SEEDREAM_4_5_MODEL,
  DEFAULT_ASPECT_RATIO.ratio,
  DEFAULT_RESOLUTION_TIER,
)

interface Seedream45State {
  positivePrompt: string
  aspectRatioLabel: string
  resolutionTierLabel: string
  width: number
  height: number
  seed: number | null
  quantity: number
  outputFormat: 'JPG' | 'PNG' | 'WEBP'
  outputQuality: number
  referenceImages: string[]

  setField: <K extends 'positivePrompt' | 'seed'>(field: K, value: Seedream45State[K]) => void
  setAspectRatio: (label: string) => void
  setResolutionTier: (label: string) => void
  setQuantity: (quantity: number) => void
  setOutputFormat: (format: Seedream45State['outputFormat']) => void
  setOutputQuality: (quality: number) => void
  addReferenceImage: (image: string) => void
  removeReferenceImage: (index: number) => void
  updateReferenceImage: (index: number, image: string) => void
  loadFromJob: (job: Seedream45Job, options?: { includeSeed?: boolean }) => void
  resetForm: () => void
}

const DEFAULTS = {
  positivePrompt: '',
  aspectRatioLabel: DEFAULT_ASPECT_RATIO.label,
  resolutionTierLabel: DEFAULT_RESOLUTION_TIER.label,
  width: initialDimensions.width,
  height: initialDimensions.height,
  seed: null as number | null,
  quantity: 1,
  outputFormat: usePreferencesStore.getState().preferredOutputFormat,
  outputQuality: 95,
  referenceImages: [] as string[],
}

export const useSeedream45Store = create<Seedream45State>((set, get) => ({
  ...DEFAULTS,

  setField: (field, value) => set({ [field]: value } as never),
  setAspectRatio: (label) => {
    const ratio =
      SEEDREAM_4_5_MODEL.aspectRatios.find((r) => r.label === label) ?? SEEDREAM_4_5_MODEL.aspectRatios[0]
    const tier =
      SEEDREAM_4_5_MODEL.resolutionTiers.find((t) => t.label === get().resolutionTierLabel) ??
      SEEDREAM_4_5_MODEL.resolutionTiers[0]
    const { width, height } = resolveDimensions(SEEDREAM_4_5_MODEL, ratio.ratio, tier)
    set({ aspectRatioLabel: label, width, height })
  },
  setResolutionTier: (label) => {
    const tier =
      SEEDREAM_4_5_MODEL.resolutionTiers.find((t) => t.label === label) ?? SEEDREAM_4_5_MODEL.resolutionTiers[0]
    const ratio =
      SEEDREAM_4_5_MODEL.aspectRatios.find((r) => r.label === get().aspectRatioLabel) ??
      SEEDREAM_4_5_MODEL.aspectRatios[0]
    const { width, height } = resolveDimensions(SEEDREAM_4_5_MODEL, ratio.ratio, tier)
    set({ resolutionTierLabel: label, width, height })
  },
  setQuantity: (quantity) => set({ quantity: Math.min(20, Math.max(1, quantity)) }),
  setOutputFormat: (outputFormat) => set({ outputFormat }),
  setOutputQuality: (outputQuality) => set({ outputQuality }),
  addReferenceImage: (image) => {
    const referenceImages = get().referenceImages
    if (referenceImages.length >= (SEEDREAM_4_5_MODEL.maxReferenceImages ?? 14)) return
    set({ referenceImages: [...referenceImages, image] })
  },
  removeReferenceImage: (index) => {
    set({ referenceImages: get().referenceImages.filter((_, i) => i !== index) })
  },
  updateReferenceImage: (index, image) => {
    set({ referenceImages: get().referenceImages.map((img, i) => (i === index ? image : img)) })
  },
  loadFromJob: (job, options) => {
    const ratio = findClosestAspectRatio(SEEDREAM_4_5_MODEL, job.width, job.height)
    const tier = findClosestResolutionTier(SEEDREAM_4_5_MODEL, job.width, job.height)
    set({
      positivePrompt: job.positivePrompt,
      aspectRatioLabel: ratio.label,
      resolutionTierLabel: tier.label,
      width: job.width,
      height: job.height,
      seed: options?.includeSeed ? job.result?.seed ?? job.seed : null,
      outputFormat: job.outputFormat,
      referenceImages: job.referenceImages,
    })
  },
  resetForm: () => set(DEFAULTS),
}))
