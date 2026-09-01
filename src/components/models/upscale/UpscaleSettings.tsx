import { NumericSlider } from '../../NumericSlider'
import { Tooltip } from '../../Tooltip'

interface UpscaleSettingsProps {
  mode: 'factor' | 'megapixels'
  upscaleFactor: number
  targetMegapixels: number
  enhanceDetails: boolean
  realism: boolean
  onModeChange: (mode: 'factor' | 'megapixels') => void
  onUpscaleFactorChange: (value: number) => void
  onTargetMegapixelsChange: (value: number) => void
  onEnhanceDetailsChange: (value: boolean) => void
  onRealismChange: (value: boolean) => void
}

function Switch({
  label,
  tooltip,
  enabled,
  onToggle,
}: {
  label: string
  tooltip: string
  enabled: boolean
  onToggle: () => void
}) {
  return (
    <div className="flex items-center justify-between rounded-md border border-neutral-70 bg-input p-2.5">
      <span className="flex items-center gap-1 text-xs font-medium text-neutral-5">
        {label}
        <Tooltip text={tooltip} />
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={onToggle}
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
          enabled ? 'bg-brand-green' : 'bg-neutral-70'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-neutral-5 transition-transform ${
            enabled ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  )
}

export function UpscaleSettings({
  mode,
  upscaleFactor,
  targetMegapixels,
  enhanceDetails,
  realism,
  onModeChange,
  onUpscaleFactorChange,
  onTargetMegapixelsChange,
  onEnhanceDetailsChange,
  onRealismChange,
}: UpscaleSettingsProps) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label className="text-sm font-medium text-neutral-5">Upscale target</label>
          <div className="flex overflow-hidden rounded-md border border-neutral-70">
            <button
              type="button"
              onClick={() => onModeChange('factor')}
              className={`px-2.5 py-1 text-xs font-medium transition-colors ${
                mode === 'factor'
                  ? 'bg-neutral-5 text-neutral-100'
                  : 'bg-input text-neutral-30 hover:bg-neutral-80'
              }`}
            >
              Multiplier
            </button>
            <button
              type="button"
              onClick={() => onModeChange('megapixels')}
              className={`border-l border-neutral-70 px-2.5 py-1 text-xs font-medium transition-colors ${
                mode === 'megapixels'
                  ? 'bg-neutral-5 text-neutral-100'
                  : 'bg-input text-neutral-30 hover:bg-neutral-80'
              }`}
            >
              Megapixels
            </button>
          </div>
        </div>
        {mode === 'factor' ? (
          <NumericSlider label="Upscale factor" value={upscaleFactor} min={2} max={16} onChange={onUpscaleFactorChange} />
        ) : (
          <NumericSlider
            label="Target megapixels"
            value={targetMegapixels}
            min={1}
            max={128}
            onChange={onTargetMegapixelsChange}
          />
        )}
      </div>

      <Switch
        label="Enhance details"
        tooltip="Enhances fine textures; may increase contrast."
        enabled={enhanceDetails}
        onToggle={() => onEnhanceDetailsChange(!enhanceDetails)}
      />
      <Switch
        label="Realism"
        tooltip="Improves realism; recommended for AI-generated images."
        enabled={realism}
        onToggle={() => onRealismChange(!realism)}
      />
    </div>
  )
}
