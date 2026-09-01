import type { AspectRatioOption, ImageInferenceModelDefinition, ResolutionTier } from './types'

const SD15_CHILLOUTMIX_ASPECT_RATIOS: AspectRatioOption[] = [
  { label: '1:1', ratio: 1 / 1, icon: 'square' },
  { label: '3:2', ratio: 3 / 2, icon: 'landscape' },
  { label: '2:3', ratio: 2 / 3, icon: 'portrait' },
]

// SD1.5 was trained at 512x512 — these tiers roughly match Civitai's own generator presets
// (512x512, 768x512, ...) for this checkpoint. Native resolution is 512; the model still
// runs above that (up to maxDimension below) but quality degrades the further you go.
const SD15_CHILLOUTMIX_RESOLUTION_TIERS: ResolutionTier[] = [
  { label: '512', megapixels: 0.262144 }, // 512x512
  { label: '768', megapixels: 0.589824 }, // 768x768
]

export const SD15_CHILLOUTMIX_MODEL: ImageInferenceModelDefinition = {
  ecosystem: 'sd15',
  id: 'civitai:6424@11745',
  label: 'SD1.5 ChilloutMix NI (Pruned FP32)',
  description:
    'Community SD1.5 checkpoint popular for photorealistic Asian portraiture. Native resolution is 512px — usable somewhat above that, but quality falls off well before SDXL-class ceilings.',
  taskType: 'imageInference',
  hidden: true,
  defaultSteps: 25,
  maxSteps: 60,
  defaultCFGScale: 7,
  maxCFGScale: 20,
  supportsNegativePrompt: true,
  // Runware's imageInference width/height must be a multiple of 64, 128-2048 — same
  // platform-wide rule confirmed on the Realistic Vision SD1.5 checkpoint (civitai:4201@130072).
  dimensionMultiple: 64,
  minDimension: 128,
  maxDimension: 1024,
  aspectRatios: SD15_CHILLOUTMIX_ASPECT_RATIOS,
  resolutionTiers: SD15_CHILLOUTMIX_RESOLUTION_TIERS,
  pricePerMegapixel: 0.0038,
  // No acceleratorKind — Runware rejects fbCache/etc for SD1.5 ("not compatible with the
  // selected model architecture"), unlike the SDXL-family checkpoints (Illustrious, AutismMix).
  supportsVae: true,
}
