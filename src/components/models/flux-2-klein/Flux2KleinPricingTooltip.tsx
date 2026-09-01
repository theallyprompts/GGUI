import type { ImageInferenceModelDefinition } from '../../../lib/models'
import { useFlux2KleinStore } from '../../../store/models/flux2Klein.store'

export function Flux2KleinPricingInfo({ model }: { model: ImageInferenceModelDefinition }) {
  const width = useFlux2KleinStore((s) => s.width)
  const height = useFlux2KleinStore((s) => s.height)
  const variantId = useFlux2KleinStore((s) => s.variantId)
  const variant = model.variants?.find((v) => v.id === variantId) ?? model.variants?.[0]
  const pricePerMegapixel = variant?.pricePerMegapixel ?? model.pricePerMegapixel
  const megapixels = (width * height) / 1_000_000
  const cost = megapixels * pricePerMegapixel

  return (
    <div className="rounded-md border border-brand-green-text/30 bg-brand-green/10 px-2.5 py-2 text-xs">
      <p className="font-medium text-brand-green-text">
        ~${cost.toFixed(4)} <span className="font-normal text-neutral-40">at {width}×{height} ({variant?.label})</span>
      </p>
      <p className="text-neutral-30">${pricePerMegapixel.toFixed(5)} per megapixel.</p>
    </div>
  )
}
