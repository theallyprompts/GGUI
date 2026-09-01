import type { ModelDefinition } from './types'
import { INTRODUCTION_MODEL } from './introduction'
import { Z_IMAGE_MODEL } from './z-image'
import { UPSCALE_MODEL } from './upscale'
import { MINIMAX_H3_MODEL } from './minimax-h3'
import { FLUX_1_DEV_MODEL } from './flux-1-dev'
import { ILLUSTRIOUS_MODEL } from './illustrious'
import { AUTISMMIX_PONY_MODEL } from './autismmix-pony'
import { FLUX_2_KLEIN_MODEL } from './flux-2-klein'
import { SEEDREAM_4_5_MODEL } from './seedream-4-5'
import { SD15_REALISTIC_VISION_MODEL } from './sd15-realistic-vision'
import { SD15_CHILLOUTMIX_MODEL } from './sd15-chilloutmix'
import { REMBG_MODEL } from './rembg'
import { EXTRACT_METADATA_MODEL } from './extract-metadata'
import { UPLOAD_MODEL_MODEL } from './upload-model'
import { MANAGE_MEDIA_MODEL } from './manage-media'

export const MODELS: ModelDefinition[] = [
  INTRODUCTION_MODEL,
  Z_IMAGE_MODEL,
  FLUX_1_DEV_MODEL,
  FLUX_2_KLEIN_MODEL,
  SEEDREAM_4_5_MODEL,
  ILLUSTRIOUS_MODEL,
  AUTISMMIX_PONY_MODEL,
  SD15_REALISTIC_VISION_MODEL,
  SD15_CHILLOUTMIX_MODEL,
  MINIMAX_H3_MODEL,
  UPSCALE_MODEL,
  REMBG_MODEL,
  EXTRACT_METADATA_MODEL,
  UPLOAD_MODEL_MODEL,
  MANAGE_MEDIA_MODEL,
]

export const DEFAULT_MODEL = Z_IMAGE_MODEL

export function findModel(id: string): ModelDefinition {
  return MODELS.find((m) => m.id === id) ?? DEFAULT_MODEL
}
