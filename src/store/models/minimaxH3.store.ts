import { create } from 'zustand'
import { MINIMAX_H3_MODEL, findVideoResolution } from '../../lib/models'
import type { MinimaxH3Job } from '../generation.store'

export type MinimaxH3InputMode = 'frames' | 'references'

export interface FrameImageEntry {
  image: string
  frame: 'first' | 'last'
}

const DEFAULT_ASPECT_RATIO_LABEL = '16:9'
const DEFAULT_RESOLUTION_TIER_LABEL = '768p'

const initialResolution = findVideoResolution(
  MINIMAX_H3_MODEL,
  DEFAULT_ASPECT_RATIO_LABEL,
  DEFAULT_RESOLUTION_TIER_LABEL,
)

interface MinimaxH3State {
  positivePrompt: string
  aspectRatioLabel: string
  resolutionTierLabel: string
  width: number
  height: number
  duration: number
  seed: number | null
  quantity: number
  outputFormat: 'MP4' | 'WEBM' | 'MOV'

  inputMode: MinimaxH3InputMode
  frameImages: FrameImageEntry[]
  referenceImages: string[]
  referenceVideos: string[]
  referenceAudios: string[]

  setField: <K extends 'positivePrompt' | 'seed'>(field: K, value: MinimaxH3State[K]) => void
  setAspectRatio: (label: string) => void
  setResolutionTier: (label: string) => void
  setDuration: (duration: number) => void
  setQuantity: (quantity: number) => void
  setOutputFormat: (format: MinimaxH3State['outputFormat']) => void
  setInputMode: (mode: MinimaxH3InputMode) => void
  setFrameImage: (frame: 'first' | 'last', image: string | null) => void
  addReferenceImage: (image: string) => void
  removeReferenceImage: (index: number) => void
  addReferenceVideo: (video: string) => void
  removeReferenceVideo: (index: number) => void
  addReferenceAudio: (audio: string) => void
  removeReferenceAudio: (index: number) => void
  loadFromJob: (job: MinimaxH3Job, options?: { includeSeed?: boolean }) => void
  resetForm: () => void
}

const DEFAULTS = {
  positivePrompt: '',
  aspectRatioLabel: DEFAULT_ASPECT_RATIO_LABEL,
  resolutionTierLabel: DEFAULT_RESOLUTION_TIER_LABEL,
  width: initialResolution.width,
  height: initialResolution.height,
  duration: MINIMAX_H3_MODEL.defaultDuration,
  seed: null as number | null,
  quantity: 1,
  outputFormat: 'MP4' as const,
  inputMode: 'frames' as MinimaxH3InputMode,
  frameImages: [] as FrameImageEntry[],
  referenceImages: [] as string[],
  referenceVideos: [] as string[],
  referenceAudios: [] as string[],
}

export const useMinimaxH3Store = create<MinimaxH3State>((set, get) => ({
  ...DEFAULTS,

  setField: (field, value) => set({ [field]: value } as never),
  setAspectRatio: (label) => {
    const { width, height } = findVideoResolution(MINIMAX_H3_MODEL, label, get().resolutionTierLabel)
    set({ aspectRatioLabel: label, width, height })
  },
  setResolutionTier: (label) => {
    const { width, height } = findVideoResolution(MINIMAX_H3_MODEL, get().aspectRatioLabel, label)
    set({ resolutionTierLabel: label, width, height })
  },
  setDuration: (duration) =>
    set({
      duration: Math.min(MINIMAX_H3_MODEL.maxDuration, Math.max(MINIMAX_H3_MODEL.minDuration, duration)),
    }),
  setQuantity: (quantity) => set({ quantity: Math.min(4, Math.max(1, quantity)) }),
  setOutputFormat: (outputFormat) => set({ outputFormat }),
  setInputMode: (inputMode) => {
    if (inputMode === get().inputMode) return
    set({ inputMode, frameImages: [], referenceImages: [], referenceVideos: [], referenceAudios: [] })
  },
  setFrameImage: (frame, image) => {
    const rest = get().frameImages.filter((f) => f.frame !== frame)
    set({ frameImages: image ? [...rest, { image, frame }] : rest })
  },
  addReferenceImage: (image) => {
    const referenceImages = get().referenceImages
    if (referenceImages.length >= MINIMAX_H3_MODEL.maxReferenceImages) return
    set({ referenceImages: [...referenceImages, image] })
  },
  removeReferenceImage: (index) => {
    set({ referenceImages: get().referenceImages.filter((_, i) => i !== index) })
  },
  addReferenceVideo: (video) => {
    const referenceVideos = get().referenceVideos
    if (referenceVideos.length >= MINIMAX_H3_MODEL.maxReferenceVideos) return
    set({ referenceVideos: [...referenceVideos, video] })
  },
  removeReferenceVideo: (index) => {
    set({ referenceVideos: get().referenceVideos.filter((_, i) => i !== index) })
  },
  addReferenceAudio: (audio) => {
    const referenceAudios = get().referenceAudios
    if (referenceAudios.length >= MINIMAX_H3_MODEL.maxReferenceAudios) return
    set({ referenceAudios: [...referenceAudios, audio] })
  },
  removeReferenceAudio: (index) => {
    set({ referenceAudios: get().referenceAudios.filter((_, i) => i !== index) })
  },
  loadFromJob: (job, options) => {
    set({
      positivePrompt: job.positivePrompt,
      aspectRatioLabel: job.aspectRatioLabel,
      resolutionTierLabel: job.resolutionTierLabel,
      width: job.width,
      height: job.height,
      duration: job.duration,
      seed: options?.includeSeed ? job.result?.seed ?? job.seed : null,
      outputFormat: job.outputFormat,
      inputMode: job.inputMode,
      frameImages: job.frameImages,
      referenceImages: job.referenceImages,
      referenceVideos: job.referenceVideos,
      referenceAudios: job.referenceAudios,
    })
  },
  resetForm: () => set(DEFAULTS),
}))
