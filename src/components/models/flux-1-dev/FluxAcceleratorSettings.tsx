import type { CacheAcceleratorOptions } from '../../../lib/runware/types'
import { NumericSlider } from '../../NumericSlider'
import { Tooltip } from '../../Tooltip'

interface FluxAcceleratorSettingsProps {
  value: CacheAcceleratorOptions
  onChange: (patch: Partial<CacheAcceleratorOptions>) => void
}

interface CacheDef {
  key: 'teaCache' | 'dbCache'
  thresholdKey: 'teaCacheDistance' | 'dbCacheThreshold'
  label: string
  thresholdLabel: string
  tooltip: string
}

const CACHES: CacheDef[] = [
  {
    key: 'teaCache',
    thresholdKey: 'teaCacheDistance',
    label: 'TeaCache',
    thresholdLabel: 'Skip aggressiveness',
    tooltip:
      'Estimates step-to-step differences to skip redundant computation. Lower values favor quality; higher values favor speed.',
  },
  {
    key: 'dbCache',
    thresholdKey: 'dbCacheThreshold',
    label: 'DB Cache',
    thresholdLabel: 'Reuse sensitivity',
    tooltip:
      'Caches intermediate transformer outputs (CacheDiT). Lower values reuse more aggressively (faster, higher risk of quality loss).',
  },
]

export function FluxAcceleratorSettings({ value, onChange }: FluxAcceleratorSettingsProps) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-neutral-40">
        Caching mechanisms that trade a small amount of quality for faster generation. Only one
        can be active at a time.
      </p>

      {CACHES.map((cache) => {
        const enabled = Boolean(value[cache.key])
        return (
          <div key={cache.key} className="rounded-md border border-neutral-70 bg-input p-2.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-xs font-medium text-neutral-5">
                {cache.label}
                <Tooltip text={cache.tooltip} />
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={enabled}
                onClick={() => {
                  if (enabled) {
                    onChange({ [cache.key]: false })
                    return
                  }
                  const others = CACHES.filter((c) => c.key !== cache.key)
                  onChange({
                    [cache.key]: true,
                    ...Object.fromEntries(others.map((c) => [c.key, false])),
                  })
                }}
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
            {enabled && (
              <div className="mt-2.5 flex flex-col gap-2.5">
                <NumericSlider
                  label={cache.thresholdLabel}
                  value={value[cache.thresholdKey] ?? 0.25}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={(v) => onChange({ [cache.thresholdKey]: v })}
                />
                {cache.key === 'dbCache' && (
                  <NumericSlider
                    label="Skip interval"
                    tooltip="How many steps to skip between cache refreshes. Higher values skip more steps for faster generation at the cost of quality."
                    value={value.dbCacheSkipInterval ?? 5}
                    min={1}
                    max={20}
                    onChange={(v) => onChange({ dbCacheSkipInterval: v })}
                  />
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
