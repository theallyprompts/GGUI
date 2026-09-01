import type { UpscaleModelDefinition } from './types'

export const UPSCALE_MODEL: UpscaleModelDefinition = {
  id: 'prunaai:p-image@upscale',
  label: 'Image Upscale',
  description:
    'AI-powered upscaling up to 8 megapixels with detail and realism enhancement. Powered by Pruna P-Image Upscale.',
  taskType: 'upscale',
  minUpscaleFactor: 2,
  maxUpscaleFactor: 16,
  defaultUpscaleFactor: 4,
  minTargetMegapixels: 1,
  maxTargetMegapixels: 128,
  pricingTiers: [
    { maxMegapixels: 4, pricePerImage: 0.005 },
    { maxMegapixels: 8, pricePerImage: 0.01 },
    { maxMegapixels: 16, pricePerImage: 0.02 },
    { maxMegapixels: 32, pricePerImage: 0.04 },
    { maxMegapixels: 64, pricePerImage: 0.06 },
    { maxMegapixels: 128, pricePerImage: 0.12 },
  ],
}
