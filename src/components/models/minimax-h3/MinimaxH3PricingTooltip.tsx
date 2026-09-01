import { estimateVideoInferenceCost, type VideoInferenceModelDefinition } from '../../../lib/models'
import { useMinimaxH3Store } from '../../../store/models/minimaxH3.store'

export function MinimaxH3PricingInfo({ model }: { model: VideoInferenceModelDefinition }) {
  const duration = useMinimaxH3Store((s) => s.duration)
  const cost = estimateVideoInferenceCost(model, duration)

  return (
    <div className="rounded-md border border-brand-green-text/30 bg-brand-green/10 px-2.5 py-2 text-xs">
      <p className="font-medium text-brand-green-text">
        ~${cost.toFixed(4)} <span className="font-normal text-neutral-40">at {duration}s</span>
      </p>
      <p className="text-neutral-30">${model.pricePerSecond.toFixed(4)} per second (2K, base rate).</p>
    </div>
  )
}
