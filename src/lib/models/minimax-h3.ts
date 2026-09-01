import type { AspectRatioOption, ResolutionTier, VideoInferenceModelDefinition, VideoResolutionOption } from './types'

// Runware only accepts 12 fixed (width, height) pairs for this model — no arbitrary
// custom dimensions despite width/height being plain integers in the schema.
const MINIMAX_H3_ASPECT_RATIOS: AspectRatioOption[] = [
  { label: '16:9', ratio: 16 / 9, icon: 'landscape-wide' },
  { label: '4:3', ratio: 4 / 3, icon: 'landscape' },
  { label: '1:1', ratio: 1 / 1, icon: 'square' },
  { label: '3:4', ratio: 3 / 4, icon: 'portrait' },
  { label: '9:16', ratio: 9 / 16, icon: 'portrait-tall' },
  { label: '21:9', ratio: 21 / 9, icon: 'landscape-wide' },
]

const MINIMAX_H3_RESOLUTION_TIERS: ResolutionTier[] = [
  { label: '768p', megapixels: 0.75 },
  { label: '2K', megapixels: 3.5 },
]

const MINIMAX_H3_RESOLUTIONS: VideoResolutionOption[] = [
  { aspectRatioLabel: '16:9', resolutionTierLabel: '768p', width: 1344, height: 768 },
  { aspectRatioLabel: '4:3', resolutionTierLabel: '768p', width: 1024, height: 768 },
  { aspectRatioLabel: '1:1', resolutionTierLabel: '768p', width: 768, height: 768 },
  { aspectRatioLabel: '3:4', resolutionTierLabel: '768p', width: 768, height: 1024 },
  { aspectRatioLabel: '9:16', resolutionTierLabel: '768p', width: 768, height: 1344 },
  { aspectRatioLabel: '21:9', resolutionTierLabel: '768p', width: 1536, height: 672 },
  { aspectRatioLabel: '16:9', resolutionTierLabel: '2K', width: 2560, height: 1440 },
  { aspectRatioLabel: '4:3', resolutionTierLabel: '2K', width: 1920, height: 1440 },
  { aspectRatioLabel: '1:1', resolutionTierLabel: '2K', width: 1440, height: 1440 },
  { aspectRatioLabel: '3:4', resolutionTierLabel: '2K', width: 1440, height: 1920 },
  { aspectRatioLabel: '9:16', resolutionTierLabel: '2K', width: 1440, height: 2560 },
  { aspectRatioLabel: '21:9', resolutionTierLabel: '2K', width: 2944, height: 1248 },
]

export const MINIMAX_H3_MODEL: VideoInferenceModelDefinition = {
  ecosystem: 'minimax-video',
  id: 'minimax:h3@0',
  label: 'MiniMax H3',
  description:
    'Multimodal video generation with native synced audio, multi-reference consistency, and continuation workflows.',
  taskType: 'videoInference',
  aspectRatios: MINIMAX_H3_ASPECT_RATIOS,
  resolutionTiers: MINIMAX_H3_RESOLUTION_TIERS,
  resolutions: MINIMAX_H3_RESOLUTIONS,
  minDuration: 5,
  maxDuration: 15,
  defaultDuration: 5,
  maxReferenceImages: 9,
  maxFrameImages: 2,
  maxReferenceVideos: 3,
  maxReferenceAudios: 3,
  pricePerSecond: 0.1391,
}
