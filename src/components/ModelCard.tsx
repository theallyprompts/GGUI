import { useState } from 'react'
import type { ModelDefinition } from '../lib/models'
import { ModelPricingInfo } from './models/registry'

export function ModelCard({ model }: { model: ModelDefinition }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="rounded-md border border-neutral-70 bg-card p-2">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-3 text-left"
        aria-expanded={expanded}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-neutral-80 text-brand-green-text">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="m21 15-5-5L5 21" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-neutral-5">{model.label}</p>
          {!expanded && <p className="text-xs text-neutral-40">more info…</p>}
        </div>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`h-3.5 w-3.5 shrink-0 text-neutral-40 transition-transform ${expanded ? 'rotate-180' : ''}`}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {expanded && (
        <div className="mt-2 space-y-2">
          <p className="text-xs leading-relaxed text-neutral-40">{model.description}</p>
          <ModelPricingInfo model={model} />
        </div>
      )}
    </div>
  )
}
