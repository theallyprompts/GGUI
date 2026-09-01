import type { ImageInferenceModelDefinition, UpscaleModelDefinition, VideoInferenceModelDefinition } from './types'

export function estimateImageInferenceCost(
  model: ImageInferenceModelDefinition,
  width: number,
  height: number,
): number {
  if (model.pricePerImage !== undefined) return model.pricePerImage
  const megapixels = (width * height) / 1_000_000
  return megapixels * model.pricePerMegapixel
}

export function tierForMegapixels(model: UpscaleModelDefinition, megapixels: number) {
  return (
    model.pricingTiers.find((tier) => megapixels <= tier.maxMegapixels) ??
    model.pricingTiers[model.pricingTiers.length - 1]
  )
}

export function estimateVideoInferenceCost(model: VideoInferenceModelDefinition, duration: number): number {
  return duration * model.pricePerSecond
}
