import { Tooltip } from './Tooltip'

interface NumericSliderProps {
  label: string
  value: number
  min: number
  max: number
  step?: number
  tooltip?: string
  onChange: (value: number) => void
}

export function NumericSlider({
  label,
  value,
  min,
  max,
  step = 1,
  tooltip,
  onChange,
}: NumericSliderProps) {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-1 text-xs font-medium text-neutral-20">
        {label}
        {tooltip && <Tooltip text={tooltip} />}
      </div>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full accent-brand-green"
        />
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => {
            const next = Number(e.target.value)
            if (!Number.isNaN(next)) onChange(Math.min(max, Math.max(min, next)))
          }}
          className="w-20 shrink-0 rounded-md border border-neutral-70 bg-input px-2 py-1 text-center font-mono text-sm text-neutral-5 outline-none focus:border-brand-green-text"
        />
      </div>
    </div>
  )
}
