import { X } from 'lucide-react'

interface VaeInputProps {
  value: string
  onChange: (value: string) => void
}

export function VaeInput({ value, onChange }: VaeInputProps) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-neutral-5">VAE (optional)</label>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="civitai:1052020@1180455"
          className="min-w-0 flex-1 rounded-md border border-neutral-70 bg-input px-3 py-2 font-mono text-sm text-neutral-5 placeholder-neutral-50 outline-none focus:border-brand-green-text"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label="Clear VAE"
            className="shrink-0 rounded-md p-2 text-neutral-40 transition-colors hover:bg-neutral-80 hover:text-brand-destructive"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}
