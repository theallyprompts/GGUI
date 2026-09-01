import type { VideoInferenceModelDefinition } from '../../../lib/models'
import { AspectRatioIcon } from '../z-image/AspectRatioIcon'

interface VideoResolutionPickerProps {
  model: VideoInferenceModelDefinition
  aspectRatioLabel: string
  resolutionTierLabel: string
  width: number
  height: number
  onAspectRatioChange: (label: string) => void
  onResolutionTierChange: (label: string) => void
}

export function VideoResolutionPicker({
  model,
  aspectRatioLabel,
  resolutionTierLabel,
  width,
  height,
  onAspectRatioChange,
  onResolutionTierChange,
}: VideoResolutionPickerProps) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label className="text-sm font-medium text-neutral-5">Aspect ratio</label>
        <span className="font-mono text-xs text-neutral-40">
          {width}×{height}
        </span>
      </div>

      <div className="grid grid-cols-6 gap-1.5">
        {model.aspectRatios.map((option) => {
          const active = option.label === aspectRatioLabel
          return (
            <button
              key={option.label}
              type="button"
              onClick={() => onAspectRatioChange(option.label)}
              title={option.label}
              className={`flex flex-col items-center gap-1 rounded-md border py-2 text-center transition-colors ${
                active
                  ? 'border-brand-green-text bg-brand-green/10'
                  : 'border-neutral-70 bg-input hover:bg-neutral-80'
              }`}
            >
              <AspectRatioIcon shape={option.icon} active={active} />
              <span
                className={`text-[11px] font-semibold ${active ? 'text-brand-green-text' : 'text-neutral-5'}`}
              >
                {option.label}
              </span>
            </button>
          )
        })}
      </div>

      <div className="mt-2 grid grid-cols-2 gap-1.5">
        {model.resolutionTiers.map((tier) => {
          const active = tier.label === resolutionTierLabel
          return (
            <button
              key={tier.label}
              type="button"
              onClick={() => onResolutionTierChange(tier.label)}
              className={`rounded-md border py-1.5 text-xs font-medium transition-colors ${
                active
                  ? 'border-brand-green-text bg-brand-green/10 text-brand-green-text'
                  : 'border-neutral-70 bg-input text-neutral-20 hover:bg-neutral-80'
              }`}
            >
              {tier.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
