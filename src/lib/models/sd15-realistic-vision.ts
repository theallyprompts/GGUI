import type { AspectRatioOption, ImageInferenceModelDefinition, ResolutionTier } from './types'

const SD15_REALISTIC_VISION_ASPECT_RATIOS: AspectRatioOption[] = [
  { label: '1:1', ratio: 1 / 1, icon: 'square' },
  { label: '3:2', ratio: 3 / 2, icon: 'landscape' },
  { label: '2:3', ratio: 2 / 3, icon: 'portrait' },
]

// SD1.5 was trained at 512x512 — these tiers roughly match Civitai's own generator presets
// (512x512, 768x512, ...) for this checkpoint. Native resolution is 512; the model still
// runs above that (up to maxDimension below) but quality degrades the further you go.
const SD15_REALISTIC_VISION_RESOLUTION_TIERS: ResolutionTier[] = [
  { label: '512', megapixels: 0.262144 }, // 512x512
  { label: '768', megapixels: 0.589824 }, // 768x768
]

export const SD15_REALISTIC_VISION_MODEL: ImageInferenceModelDefinition = {
  ecosystem: 'sd15',
  id: 'civitai:4201@130072',
  label: 'SD1.5 Realistic Vision V6.0 B1',
  description:
    'Community SD1.5 checkpoint tuned for photorealistic output. Native resolution is 512px — usable somewhat above that, but quality falls off well before SDXL-class ceilings.',
  taskType: 'imageInference',
  defaultSteps: 25,
  maxSteps: 60,
  defaultCFGScale: 7,
  maxCFGScale: 20,
  supportsNegativePrompt: true,
  // Runware's imageInference width/height must be a multiple of 64, 128-2048 — confirmed via a
  // live 400 error ("multiples of '64'") when this was set to 8/1024, which SD1.5's own native
  // resolution wouldn't have hit. Not an SD1.5-specific relaxation; matches the platform-wide rule.
  dimensionMultiple: 64,
  minDimension: 128,
  maxDimension: 1024,
  aspectRatios: SD15_REALISTIC_VISION_ASPECT_RATIOS,
  resolutionTiers: SD15_REALISTIC_VISION_RESOLUTION_TIERS,
  pricePerMegapixel: 0.0038,
  // No acceleratorKind — Runware rejects fbCache/etc for SD1.5 ("not compatible with the
  // selected model architecture"), unlike the SDXL-family checkpoints (Illustrious, AutismMix).
  supportsVae: true,
}
