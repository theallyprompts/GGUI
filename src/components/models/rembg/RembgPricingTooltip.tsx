import type { RemoveBackgroundModelDefinition } from '../../../lib/models'
import { useRembgStore } from '../../../store/models/rembg.store'

export function RembgPricingInfo({ model }: { model: RemoveBackgroundModelDefinition }) {
  const variantId = useRembgStore((s) => s.variantId)
  const variant = model.variants?.find((v) => v.id === variantId) ?? model.variants?.[0]
  const pricePerImage = variant?.pricePerImage ?? model.pricePerImage

  return (
    <div className="rounded-md border border-brand-green-text/30 bg-brand-green/10 px-2.5 py-2 text-xs">
      <p className="font-medium text-brand-green-text">
        ~${pricePerImage.toFixed(4)} per image
        {variant && <span className="font-normal text-neutral-40"> ({variant.label})</span>}
      </p>
      <p className="text-neutral-30">Actual cost varies with input image complexity.</p>
    </div>
  )
}
