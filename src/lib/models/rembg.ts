import type { RemoveBackgroundModelDefinition } from './types'

export const REMBG_VARIANT_ID = 'runware:109@1'
export const BIREFNET_VARIANT_ID = 'runware:112@8'

export const REMBG_MODEL: RemoveBackgroundModelDefinition = {
  id: REMBG_VARIANT_ID,
  label: 'Background Removal',
  description:
    'Removes the background from an image, producing a transparent-background PNG. Cost varies with input image complexity.',
  taskType: 'removeBackground',
  pricePerImage: 0.0038,
  supportsSettings: true,
  variants: [
    { id: REMBG_VARIANT_ID, label: 'RemBG v1.4', pricePerImage: 0.0038, supportsSettings: true },
    { id: BIREFNET_VARIANT_ID, label: 'BiRefNet Massive', pricePerImage: 0.0006, supportsSettings: false },
  ],
}
