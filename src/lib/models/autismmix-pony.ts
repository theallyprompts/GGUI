import type { AspectRatioOption, ImageInferenceModelDefinition, ResolutionTier } from './types'

const AUTISMMIX_PONY_ASPECT_RATIOS: AspectRatioOption[] = [
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

const AUTISMMIX_PONY_RESOLUTION_TIERS: ResolutionTier[] = [
  { label: '0.5K', megapixels: 0.25 },
  { label: '1K', megapixels: 1 },
]

export const AUTISMMIX_PONY_MODEL: ImageInferenceModelDefinition = {
  ecosystem: 'sdxl-anime',
  id: 'civitai:288584@324619',
  label: 'AutismMix Pony',
  description: 'Community SDXL checkpoint built on Pony Diffusion V6, tuned for anime and illustration styles.',
  taskType: 'imageInference',
  defaultSteps: 28,
  maxSteps: 60,
  defaultCFGScale: 7,
  maxCFGScale: 20,
  supportsNegativePrompt: true,
  dimensionMultiple: 64,
  minDimension: 128,
  maxDimension: 1216,
  aspectRatios: AUTISMMIX_PONY_ASPECT_RATIOS,
  resolutionTiers: AUTISMMIX_PONY_RESOLUTION_TIERS,
  pricePerMegapixel: 0.0038,
  acceleratorKind: 'fbCache',
  supportsVae: true,
}
