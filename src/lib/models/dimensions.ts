import type { ImageInferenceModelDefinition, ResolutionTier, VideoInferenceModelDefinition } from './types'

/** Snaps a raw pixel value to the model's required multiple, clamped to its min/max. */
export function snapDimension(model: ImageInferenceModelDefinition, n: number): number {
  const m = model.dimensionMultiple
  const rounded = Math.round(n / m) * m
  return Math.min(model.maxDimension, Math.max(model.minDimension, rounded))
}

/**
 * Resolve an aspect ratio + resolution tier to concrete width/height, rounded
 * to the model's required multiple (Runware rejects sizes that aren't).
 */
export function resolveDimensions(
  model: ImageInferenceModelDefinition,
  ratio: number,
  tier: ResolutionTier,
): { width: number; height: number } {
  const targetPixels = tier.megapixels * 1_000_000
  const rawHeight = Math.sqrt(targetPixels / ratio)
  const rawWidth = rawHeight * ratio

  return { width: snapDimension(model, rawWidth), height: snapDimension(model, rawHeight) }
}

/** Finds the aspect ratio option whose ratio is closest to width/height. */
export function findClosestAspectRatio(
  model: ImageInferenceModelDefinition,
  width: number,
  height: number,
) {
  const target = width / height
  return model.aspectRatios.reduce((closest, option) =>
    Math.abs(option.ratio - target) < Math.abs(closest.ratio - target) ? option : closest,
  )
}

/** Finds the resolution tier whose megapixel count is closest to width*height. */
export function findClosestResolutionTier(
  model: ImageInferenceModelDefinition,
  width: number,
  height: number,
) {
  const targetMp = (width * height) / 1_000_000
  return model.resolutionTiers.reduce((closest, tier) =>
    Math.abs(tier.megapixels - targetMp) < Math.abs(closest.megapixels - targetMp) ? tier : closest,
  )
}

/** Looks up the exact (width, height) for a video model's aspect ratio + resolution tier combo. */
export function findVideoResolution(
  model: VideoInferenceModelDefinition,
  aspectRatioLabel: string,
  resolutionTierLabel: string,
) {
  return (
    model.resolutions.find(
      (r) => r.aspectRatioLabel === aspectRatioLabel && r.resolutionTierLabel === resolutionTierLabel,
    ) ?? model.resolutions[0]
  )
}
