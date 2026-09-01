import type { AspectRatioOption, ImageInferenceModelDefinition, ResolutionTier } from './types'

const SEEDREAM_4_5_ASPECT_RATIOS: AspectRatioOption[] = [
  { label: '1:1', ratio: 1 / 1, icon: 'square' },
  { label: '4:3', ratio: 4 / 3, icon: 'landscape' },
  { label: '3:2', ratio: 3 / 2, icon: 'landscape' },
  { label: '16:9', ratio: 16 / 9, icon: 'landscape-wide' },
  { label: '21:9', ratio: 21 / 9, icon: 'landscape-wide' },
  { label: '3:4', ratio: 3 / 4, icon: 'portrait' },
  { label: '2:3', ratio: 2 / 3, icon: 'portrait' },
  { label: '9:16', ratio: 9 / 16, icon: 'portrait-tall' },
]

const SEEDREAM_4_5_RESOLUTION_TIERS: ResolutionTier[] = [
  { label: '2K', megapixels: 4 },
  { label: '4K', megapixels: 16 },
]

export const SEEDREAM_4_5_MODEL: ImageInferenceModelDefinition = {
  ecosystem: 'seedream',
  id: 'bytedance:seedream@4.5',
  label: 'Seedream 4.5',
  description:
    "ByteDance's text-to-image and multi-image reference editing model, generating at fixed 2K or 4K resolutions from up to 14 reference images.",
  taskType: 'imageInference',
  // No steps/CFG controls — supportsSteps: false hides them in the form. Values below are unused placeholders.
  defaultSteps: 1,
  maxSteps: 1,
  defaultCFGScale: 1,
  maxCFGScale: 1,
  supportsSteps: false,
  supportsNegativePrompt: false,
  dimensionMultiple: 8,
  minDimension: 256,
  maxDimension: 16383,
  aspectRatios: SEEDREAM_4_5_ASPECT_RATIOS,
  resolutionTiers: SEEDREAM_4_5_RESOLUTION_TIERS,
  pricePerMegapixel: 0.01, // unused placeholder — pricePerImage below takes precedence
  pricePerImage: 0.04,
  maxReferenceImages: 14,
}
