import {
  Z_IMAGE_MODEL,
  FLUX_1_DEV_MODEL,
  ILLUSTRIOUS_MODEL,
  AUTISMMIX_PONY_MODEL,
  FLUX_2_KLEIN_MODEL,
  SEEDREAM_4_5_MODEL,
  SD15_REALISTIC_VISION_MODEL,
  SD15_CHILLOUTMIX_MODEL,
  MINIMAX_H3_MODEL,
  REMBG_MODEL,
  UPSCALE_MODEL,
  findModel,
} from '../../lib/models'
import { useZImageStore } from './zImage.store'
import { useFluxDevStore } from './fluxDev.store'
import { useIllustriousStore } from './illustrious.store'
import { useAutismmixPonyStore } from './autismmixPony.store'
import { useFlux2KleinStore } from './flux2Klein.store'
import { useSeedream45Store } from './seedream45.store'
import { useSd15RealisticVisionStore } from './sd15RealisticVision.store'
import { useSd15ChilloutmixStore } from './sd15Chilloutmix.store'
import { useMinimaxH3Store } from './minimaxH3.store'
import { useRembgStore } from './rembg.store'
import { useUpscaleStore } from './upscale.store'

export function isMinimaxH3Model(modelId: string): boolean {
  return modelId === MINIMAX_H3_MODEL.id
}

/** Models that can accept an externally-sourced image (via "use as input image" actions),
 *  in the order they should be listed in the "send to model" picker. */
export const IMAGE_INPUT_MODEL_IDS: string[] = [
  Z_IMAGE_MODEL.id,
  FLUX_1_DEV_MODEL.id,
  FLUX_2_KLEIN_MODEL.id,
  SEEDREAM_4_5_MODEL.id,
  ILLUSTRIOUS_MODEL.id,
  AUTISMMIX_PONY_MODEL.id,
  SD15_REALISTIC_VISION_MODEL.id,
  SD15_CHILLOUTMIX_MODEL.id,
  MINIMAX_H3_MODEL.id,
  REMBG_MODEL.id,
]

/**
 * Sets the input image on whichever imageInference-family store matches the given model ID,
 * falling back to Z-Image for unrecognized IDs. Used by "use as input image" actions, which
 * should target whatever model is currently selected rather than always Z-Image.
 *
 * MiniMax H3 is not an imageInference model and isn't handled here — its frame/reference
 * placement is ambiguous, so callers should prompt via UseAsInputModal instead of calling this.
 */
export function setInputImageForModel(modelId: string, dataUri: string): void {
  if (modelId === FLUX_1_DEV_MODEL.id) {
    useFluxDevStore.getState().setInputImage(dataUri)
  } else if (modelId === ILLUSTRIOUS_MODEL.id) {
    useIllustriousStore.getState().setInputImage(dataUri)
  } else if (modelId === AUTISMMIX_PONY_MODEL.id) {
    useAutismmixPonyStore.getState().setInputImage(dataUri)
  } else if (modelId === FLUX_2_KLEIN_MODEL.id) {
    useFlux2KleinStore.getState().addReferenceImage(dataUri)
  } else if (modelId === SEEDREAM_4_5_MODEL.id) {
    useSeedream45Store.getState().addReferenceImage(dataUri)
  } else if (modelId === SD15_REALISTIC_VISION_MODEL.id) {
    useSd15RealisticVisionStore.getState().setInputImage(dataUri)
  } else if (modelId === SD15_CHILLOUTMIX_MODEL.id) {
    useSd15ChilloutmixStore.getState().setInputImage(dataUri)
  } else if (modelId === REMBG_MODEL.id) {
    useRembgStore.getState().setInputImage(dataUri)
  } else {
    useZImageStore.getState().setInputImage(dataUri)
  }
}

/**
 * Resets whichever model's form store matches the given model ID back to its defaults.
 * Utility panes with no generation form (extract-metadata, upload-model, manage-media)
 * have nothing to reset and are silently ignored.
 */
export function resetModelForm(modelId: string): void {
  if (modelId === Z_IMAGE_MODEL.id) useZImageStore.getState().resetForm()
  else if (modelId === FLUX_1_DEV_MODEL.id) useFluxDevStore.getState().resetForm()
  else if (modelId === ILLUSTRIOUS_MODEL.id) useIllustriousStore.getState().resetForm()
  else if (modelId === AUTISMMIX_PONY_MODEL.id) useAutismmixPonyStore.getState().resetForm()
  else if (modelId === FLUX_2_KLEIN_MODEL.id) useFlux2KleinStore.getState().resetForm()
  else if (modelId === SEEDREAM_4_5_MODEL.id) useSeedream45Store.getState().resetForm()
  else if (modelId === SD15_REALISTIC_VISION_MODEL.id) useSd15RealisticVisionStore.getState().resetForm()
  else if (modelId === SD15_CHILLOUTMIX_MODEL.id) useSd15ChilloutmixStore.getState().resetForm()
  else if (modelId === MINIMAX_H3_MODEL.id) useMinimaxH3Store.getState().resetForm()
  else if (modelId === REMBG_MODEL.id) useRembgStore.getState().resetForm()
  else if (modelId === UPSCALE_MODEL.id) useUpscaleStore.getState().resetForm()
}

export type MinimaxH3InputTarget = 'first' | 'last' | 'reference'

/** Places an image into MiniMax H3's form as a first/last frame or a reference image. */
export function setMinimaxH3Input(dataUri: string, target: MinimaxH3InputTarget): void {
  const store = useMinimaxH3Store.getState()
  if (target === 'reference') {
    store.setInputMode('references')
    store.addReferenceImage(dataUri)
  } else {
    store.setInputMode('frames')
    store.setFrameImage(target, dataUri)
  }
}

interface PromptCarryover {
  getPrompt: () => string
  setPrompt: (value: string) => void
  getNegativePrompt?: () => string
  setNegativePrompt?: (value: string) => void
  getAspectRatioLabel: () => string
  setAspectRatio: (label: string) => void
}

/**
 * Per-model accessors for the fields that carry over when the user switches models —
 * prompt, negative prompt (where supported), and aspect ratio (where the label exists on
 * the destination model too). Each model keeps its own independent store, so this is the
 * one place that knows how to read/write those specific fields on every store.
 */
const PROMPT_CARRYOVER: Record<string, PromptCarryover> = {
  [Z_IMAGE_MODEL.id]: {
    getPrompt: () => useZImageStore.getState().positivePrompt,
    setPrompt: (v) => useZImageStore.getState().setField('positivePrompt', v),
    getNegativePrompt: () => useZImageStore.getState().negativePrompt,
    setNegativePrompt: (v) => useZImageStore.getState().setField('negativePrompt', v),
    getAspectRatioLabel: () => useZImageStore.getState().aspectRatioLabel,
    setAspectRatio: (label) => useZImageStore.getState().setAspectRatio(label),
  },
  [FLUX_1_DEV_MODEL.id]: {
    getPrompt: () => useFluxDevStore.getState().positivePrompt,
    setPrompt: (v) => useFluxDevStore.getState().setField('positivePrompt', v),
    getNegativePrompt: () => useFluxDevStore.getState().negativePrompt,
    setNegativePrompt: (v) => useFluxDevStore.getState().setField('negativePrompt', v),
    getAspectRatioLabel: () => useFluxDevStore.getState().aspectRatioLabel,
    setAspectRatio: (label) => useFluxDevStore.getState().setAspectRatio(label),
  },
  [ILLUSTRIOUS_MODEL.id]: {
    getPrompt: () => useIllustriousStore.getState().positivePrompt,
    setPrompt: (v) => useIllustriousStore.getState().setField('positivePrompt', v),
    getNegativePrompt: () => useIllustriousStore.getState().negativePrompt,
    setNegativePrompt: (v) => useIllustriousStore.getState().setField('negativePrompt', v),
    getAspectRatioLabel: () => useIllustriousStore.getState().aspectRatioLabel,
    setAspectRatio: (label) => useIllustriousStore.getState().setAspectRatio(label),
  },
  [AUTISMMIX_PONY_MODEL.id]: {
    getPrompt: () => useAutismmixPonyStore.getState().positivePrompt,
    setPrompt: (v) => useAutismmixPonyStore.getState().setField('positivePrompt', v),
    getNegativePrompt: () => useAutismmixPonyStore.getState().negativePrompt,
    setNegativePrompt: (v) => useAutismmixPonyStore.getState().setField('negativePrompt', v),
    getAspectRatioLabel: () => useAutismmixPonyStore.getState().aspectRatioLabel,
    setAspectRatio: (label) => useAutismmixPonyStore.getState().setAspectRatio(label),
  },
  [FLUX_2_KLEIN_MODEL.id]: {
    getPrompt: () => useFlux2KleinStore.getState().positivePrompt,
    setPrompt: (v) => useFlux2KleinStore.getState().setField('positivePrompt', v),
    getNegativePrompt: () => useFlux2KleinStore.getState().negativePrompt,
    setNegativePrompt: (v) => useFlux2KleinStore.getState().setField('negativePrompt', v),
    getAspectRatioLabel: () => useFlux2KleinStore.getState().aspectRatioLabel,
    setAspectRatio: (label) => useFlux2KleinStore.getState().setAspectRatio(label),
  },
  [SEEDREAM_4_5_MODEL.id]: {
    getPrompt: () => useSeedream45Store.getState().positivePrompt,
    setPrompt: (v) => useSeedream45Store.getState().setField('positivePrompt', v),
    getAspectRatioLabel: () => useSeedream45Store.getState().aspectRatioLabel,
    setAspectRatio: (label) => useSeedream45Store.getState().setAspectRatio(label),
  },
  [SD15_REALISTIC_VISION_MODEL.id]: {
    getPrompt: () => useSd15RealisticVisionStore.getState().positivePrompt,
    setPrompt: (v) => useSd15RealisticVisionStore.getState().setField('positivePrompt', v),
    getNegativePrompt: () => useSd15RealisticVisionStore.getState().negativePrompt,
    setNegativePrompt: (v) => useSd15RealisticVisionStore.getState().setField('negativePrompt', v),
    getAspectRatioLabel: () => useSd15RealisticVisionStore.getState().aspectRatioLabel,
    setAspectRatio: (label) => useSd15RealisticVisionStore.getState().setAspectRatio(label),
  },
  [SD15_CHILLOUTMIX_MODEL.id]: {
    getPrompt: () => useSd15ChilloutmixStore.getState().positivePrompt,
    setPrompt: (v) => useSd15ChilloutmixStore.getState().setField('positivePrompt', v),
    getNegativePrompt: () => useSd15ChilloutmixStore.getState().negativePrompt,
    setNegativePrompt: (v) => useSd15ChilloutmixStore.getState().setField('negativePrompt', v),
    getAspectRatioLabel: () => useSd15ChilloutmixStore.getState().aspectRatioLabel,
    setAspectRatio: (label) => useSd15ChilloutmixStore.getState().setAspectRatio(label),
  },
  [MINIMAX_H3_MODEL.id]: {
    getPrompt: () => useMinimaxH3Store.getState().positivePrompt,
    setPrompt: (v) => useMinimaxH3Store.getState().setField('positivePrompt', v),
    getAspectRatioLabel: () => useMinimaxH3Store.getState().aspectRatioLabel,
    setAspectRatio: (label) => useMinimaxH3Store.getState().setAspectRatio(label),
  },
}

/**
 * When switching the active model, copies the prompt/negative-prompt (if both models
 * support it) and aspect ratio (if the destination model offers that same label) from
 * the outgoing model's store into the incoming one's, instead of leaving the new form
 * blank/default. Upscale has no equivalent fields and isn't in the table, so it's a no-op.
 */
export function carryOverPromptState(fromModelId: string, toModelId: string): void {
  const from = PROMPT_CARRYOVER[fromModelId]
  const to = PROMPT_CARRYOVER[toModelId]
  if (!from || !to || fromModelId === toModelId) return

  const prompt = from.getPrompt()
  if (prompt) to.setPrompt(prompt)

  if (from.getNegativePrompt && to.setNegativePrompt) {
    const negativePrompt = from.getNegativePrompt()
    if (negativePrompt) to.setNegativePrompt(negativePrompt)
  }

  const aspectRatioLabel = from.getAspectRatioLabel()
  const toModel = findModel(toModelId)
  const hasMatchingRatio =
    'aspectRatios' in toModel && toModel.aspectRatios.some((r) => r.label === aspectRatioLabel)
  if (hasMatchingRatio) to.setAspectRatio(aspectRatioLabel)
}
