import { tierForMegapixels, type UpscaleModelDefinition } from '../../../lib/models'
import { useUpscaleStore } from '../../../store/models/upscale.store'

export function UpscalePricingInfo({ model }: { model: UpscaleModelDefinition }) {
  const mode = useUpscaleStore((s) => s.mode)
  const targetMegapixels = useUpscaleStore((s) => s.targetMegapixels)
  // Multiplier mode has no fixed output megapixel count without knowing the source
  // image's size, so fall back to the lowest tier as a representative estimate.
  const currentMegapixels = mode === 'megapixels' ? targetMegapixels : undefined
  const activeTier = currentMegapixels !== undefined ? tierForMegapixels(model, currentMegapixels) : undefined

  return (
    <div className="rounded-md border border-brand-green-text/30 bg-brand-green/10 px-2.5 py-2 text-xs">
      {activeTier && (
        <p className="mb-1 font-medium text-brand-green-text">
          ~${activeTier.pricePerImage.toFixed(4)}{' '}
          <span className="font-normal text-neutral-40">at {currentMegapixels} MP</span>
        </p>
      )}
      <p className="mb-1 text-neutral-30">Priced by output resolution:</p>
      <ul className="space-y-0.5 text-neutral-30">
        {model.pricingTiers.map((tier, i) => {
          const prevMax = model.pricingTiers[i - 1]?.maxMegapixels ?? 0
          const isActive = activeTier === tier
          return (
            <li key={tier.maxMegapixels} className={isActive ? 'text-brand-green-text' : undefined}>
              {prevMax + 1}–{tier.maxMegapixels} MP: ${tier.pricePerImage.toFixed(3)}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
