import type { AspectRatioOption, ImageInferenceModelDefinition, ResolutionTier } from './types'

const FLUX_2_KLEIN_ASPECT_RATIOS: AspectRatioOption[] = [
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

const FLUX_2_KLEIN_RESOLUTION_TIERS: ResolutionTier[] = [
  { label: '0.5K', megapixels: 0.25 },
  { label: '1K', megapixels: 1 },
  { label: '2K', megapixels: 4 },
]

export const FLUX_2_KLEIN_9B_ID = 'runware:400@2'
export const FLUX_2_KLEIN_4B_ID = 'runware:400@4'
export const FLUX_2_KLEIN_9B_KV_ID = 'runware:400@6'

export const FLUX_2_KLEIN_MODEL: ImageInferenceModelDefinition = {
  ecosystem: 'flux',
  id: FLUX_2_KLEIN_9B_ID,
  label: 'FLUX.2 [klein]',
  description:
    'Ultra-fast 4-step distilled image generation and editing from Black Forest Labs, unifying text-to-image and multi-image reference editing with sub-second latency.',
  taskType: 'imageInference',
  defaultSteps: 4,
  maxSteps: 50,
  defaultCFGScale: 3.5,
  maxCFGScale: 20,
  supportsNegativePrompt: true,
  dimensionMultiple: 16,
  minDimension: 128,
  maxDimension: 2048,
  aspectRatios: FLUX_2_KLEIN_ASPECT_RATIOS,
  resolutionTiers: FLUX_2_KLEIN_RESOLUTION_TIERS,
  pricePerMegapixel: 0.00078,
  acceleratorKind: 'cacheStep',
  supportsAccelerationLevel: true,
  maxReferenceImages: 4,
  variants: [
    { id: FLUX_2_KLEIN_9B_ID, label: '9B', pricePerMegapixel: 0.00078 },
    { id: FLUX_2_KLEIN_4B_ID, label: '4B', pricePerMegapixel: 0.0006 },
    { id: FLUX_2_KLEIN_9B_KV_ID, label: '9B KV', pricePerMegapixel: 0.00078 },
  ],
}
