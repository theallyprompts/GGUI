import type { AspectRatioOption, ImageInferenceModelDefinition, ResolutionTier } from './types'

const FLUX_1_DEV_ASPECT_RATIOS: AspectRatioOption[] = [
  { label: '1:1', ratio: 1 / 1, icon: 'square' },
  { label: '4:3', ratio: 4 / 3, icon: 'landscape' },
  { label: '3:2', ratio: 3 / 2, icon: 'landscape' },
  { label: '16:9', ratio: 16 / 9, icon: 'landscape-wide' },
  { label: '2:1', ratio: 2 / 1, icon: 'landscape-wide' },
  { label: '3:4', ratio: 3 / 4, icon: 'portrait' },
  { label: '2:3', ratio: 2 / 3, icon: 'portrait' },
  { label: '9:16', ratio: 9 / 16, icon: 'portrait-tall' },
  { label: '1:2', ratio: 1 / 2, icon: 'portrait-tall' },
]

const FLUX_1_DEV_RESOLUTION_TIERS: ResolutionTier[] = [
  { label: '0.5K', megapixels: 0.25 },
  { label: '1K', megapixels: 1 },
  { label: '2K', megapixels: 4 },
]

export const FLUX_1_DEV_MODEL: ImageInferenceModelDefinition = {
  ecosystem: 'flux',
  id: 'runware:101@1',
  label: 'FLUX.1 [dev]',
  description: '12B parameter open-weight model from Black Forest Labs, tuned for strong prompt following and fine detail.',
  taskType: 'imageInference',
  defaultSteps: 28,
  maxSteps: 50,
  defaultCFGScale: 3.5,
  maxCFGScale: 20,
  supportsNegativePrompt: true,
  dimensionMultiple: 64,
  minDimension: 128,
  maxDimension: 2048,
  aspectRatios: FLUX_1_DEV_ASPECT_RATIOS,
  resolutionTiers: FLUX_1_DEV_RESOLUTION_TIERS,
  pricePerMegapixel: 0.0038,
  acceleratorKind: 'cacheStep',
}
