import { estimateImageInferenceCost, type ImageInferenceModelDefinition } from '../../../lib/models'
import { useSd15RealisticVisionStore } from '../../../store/models/sd15RealisticVision.store'

export function Sd15RealisticVisionPricingInfo({ model }: { model: ImageInferenceModelDefinition }) {
  const width = useSd15RealisticVisionStore((s) => s.width)
  const height = useSd15RealisticVisionStore((s) => s.height)
  const cost = estimateImageInferenceCost(model, width, height)

  return (
    <div className="rounded-md border border-brand-green-text/30 bg-brand-green/10 px-2.5 py-2 text-xs">
      <p className="font-medium text-brand-green-text">
        ~${cost.toFixed(4)} <span className="font-normal text-neutral-40">at {width}×{height}</span>
      </p>
      <p className="text-neutral-30">${model.pricePerMegapixel.toFixed(4)} per megapixel.</p>
    </div>
  )
}
