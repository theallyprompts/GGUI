import { create } from 'zustand'
import { UPSCALE_MODEL } from '../../lib/models'
import { usePreferencesStore } from '../preferences.store'
import type { UpscaleJob } from '../generation.store'

interface UpscaleState {
  inputImage: string | null
  mode: 'factor' | 'megapixels'
  upscaleFactor: number
  targetMegapixels: number
  enhanceDetails: boolean
  realism: boolean
  outputFormat: 'JPG' | 'PNG' | 'WEBP'
  outputQuality: number

  setInputImage: (image: string | null) => void
  setMode: (mode: 'factor' | 'megapixels') => void
  setUpscaleFactor: (factor: number) => void
  setTargetMegapixels: (megapixels: number) => void
  setEnhanceDetails: (enabled: boolean) => void
  setRealism: (enabled: boolean) => void
  setOutputFormat: (format: UpscaleState['outputFormat']) => void
  setOutputQuality: (quality: number) => void
  loadFromJob: (job: UpscaleJob) => void
  resetForm: () => void
}

const DEFAULTS = {
  inputImage: null,
  mode: 'factor' as const,
  upscaleFactor: UPSCALE_MODEL.defaultUpscaleFactor,
  targetMegapixels: 4,
  enhanceDetails: true,
  realism: true,
  outputFormat: usePreferencesStore.getState().preferredOutputFormat,
  outputQuality: 95,
}

export const useUpscaleStore = create<UpscaleState>((set) => ({
  ...DEFAULTS,

  setInputImage: (inputImage) => set({ inputImage }),
  setMode: (mode) => set({ mode }),
  setUpscaleFactor: (upscaleFactor) =>
    set({
      upscaleFactor: Math.min(
        UPSCALE_MODEL.maxUpscaleFactor,
        Math.max(UPSCALE_MODEL.minUpscaleFactor, upscaleFactor),
      ),
    }),
  setTargetMegapixels: (targetMegapixels) =>
    set({
      targetMegapixels: Math.min(
        UPSCALE_MODEL.maxTargetMegapixels,
        Math.max(UPSCALE_MODEL.minTargetMegapixels, targetMegapixels),
      ),
    }),
  setEnhanceDetails: (enhanceDetails) => set({ enhanceDetails }),
  setRealism: (realism) => set({ realism }),
  setOutputFormat: (outputFormat) => set({ outputFormat }),
  setOutputQuality: (outputQuality) => set({ outputQuality }),
  loadFromJob: (job) => {
    set({
      inputImage: job.inputImage,
      mode: job.targetMegapixels !== undefined ? 'megapixels' : 'factor',
      upscaleFactor: job.upscaleFactor ?? DEFAULTS.upscaleFactor,
      targetMegapixels: job.targetMegapixels ?? DEFAULTS.targetMegapixels,
      enhanceDetails: job.enhanceDetails,
      realism: job.realism,
      outputFormat: job.outputFormat,
      outputQuality: job.outputQuality,
    })
  },
  resetForm: () => set(DEFAULTS),
}))
