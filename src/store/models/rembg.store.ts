import { create } from 'zustand'
import { REMBG_VARIANT_ID } from '../../lib/models'
import type { RembgJob } from '../generation.store'

interface RembgState {
  variantId: string
  inputImage: string | null
  alphaMatting: boolean
  postProcessMask: boolean

  setVariantId: (variantId: string) => void
  setInputImage: (image: string | null) => void
  setAlphaMatting: (enabled: boolean) => void
  setPostProcessMask: (enabled: boolean) => void
  loadFromJob: (job: RembgJob) => void
  resetForm: () => void
}

const DEFAULTS = {
  variantId: REMBG_VARIANT_ID,
  inputImage: null as string | null,
  alphaMatting: false,
  postProcessMask: false,
}

export const useRembgStore = create<RembgState>((set) => ({
  ...DEFAULTS,

  setVariantId: (variantId) => set({ variantId }),
  setInputImage: (inputImage) => set({ inputImage }),
  setAlphaMatting: (alphaMatting) => set({ alphaMatting }),
  setPostProcessMask: (postProcessMask) => set({ postProcessMask }),
  loadFromJob: (job) => {
    set({
      variantId: job.variantId,
      inputImage: job.inputImage,
      alphaMatting: job.alphaMatting,
      postProcessMask: job.postProcessMask,
    })
  },
  resetForm: () => set(DEFAULTS),
}))
