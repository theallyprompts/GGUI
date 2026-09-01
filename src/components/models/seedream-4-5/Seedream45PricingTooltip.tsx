import type { ImageInferenceModelDefinition } from '../../../lib/models'
import { useSeedream45Store } from '../../../store/models/seedream45.store'

export function Seedream45PricingInfo({ model }: { model: ImageInferenceModelDefinition }) {
  const width = useSeedream45Store((s) => s.width)
  const height = useSeedream45Store((s) => s.height)
  const cost = model.pricePerImage ?? 0

  return (
    <div className="rounded-md border border-brand-green-text/30 bg-brand-green/10 px-2.5 py-2 text-xs">
      <p className="font-medium text-brand-green-text">
        ~${cost.toFixed(4)} <span className="font-normal text-neutral-40">at {width}×{height}</span>
      </p>
      <p className="text-neutral-30">Flat rate per image, regardless of resolution.</p>
    </div>
  )
}
