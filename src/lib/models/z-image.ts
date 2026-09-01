import type { AspectRatioOption, ImageInferenceModelDefinition, ResolutionTier } from './types'

// Matches Civitai's generator layout: a row of aspect ratios, and separately a
// resolution tier (roughly-equal-megapixel buckets) — the pair determines width/height.
const Z_IMAGE_ASPECT_RATIOS: AspectRatioOption[] = [
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

const Z_IMAGE_RESOLUTION_TIERS: ResolutionTier[] = [
  { label: '0.5K', megapixels: 0.25 },
  { label: '1K', megapixels: 1 },
  { label: '2K', megapixels: 4 },
]

export const Z_IMAGE_MODEL: ImageInferenceModelDefinition = {
  ecosystem: 'z-image',
  id: 'runware:z-image@turbo',
  label: 'Z-Image Turbo',
  description: 'Fast distilled model tuned for high-quality results in very few steps.',
  taskType: 'imageInference',
  defaultSteps: 9,
  maxSteps: 50,
  defaultCFGScale: 1,
  maxCFGScale: 20,
  supportsNegativePrompt: true,
  dimensionMultiple: 16,
  minDimension: 128,
  maxDimension: 2048,
  aspectRatios: Z_IMAGE_ASPECT_RATIOS,
  resolutionTiers: Z_IMAGE_RESOLUTION_TIERS,
  pricePerMegapixel: 0.0034,
}
