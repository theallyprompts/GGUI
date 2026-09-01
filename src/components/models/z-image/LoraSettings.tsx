import { Plus, Trash2, ExternalLink } from 'lucide-react'
import type { RunwareLora } from '../../../lib/runware/types'
import { NumericSlider } from '../../NumericSlider'
import { useGenerationStore } from '../../../store/generation.store'
import { UPLOAD_MODEL_MODEL } from '../../../lib/models'

interface LoraSettingsProps {
  value: RunwareLora[]
  max: number
  onAdd: () => void
  onUpdate: (index: number, patch: Partial<RunwareLora>) => void
  onRemove: (index: number) => void
  /** Called right before switching to the Upload Model utility — lets a caller that renders
   *  this inside a modal (e.g. the Prompt Studio entry editor) close itself first, since the
   *  form pane it's about to navigate to is a completely different part of the app. */
  onBeforeUploadModel?: () => void
}

export function LoraSettings({ value, max, onAdd, onUpdate, onRemove, onBeforeUploadModel }: LoraSettingsProps) {
  const setModelId = useGenerationStore((s) => s.setModelId)

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-neutral-40">
        Add LoRAs by AIR ID.{' '}
        <a
          href="https://runware.ai/models/community"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-0.5 text-brand-green-text hover:underline"
        >
          Browse the community collection
          <ExternalLink className="h-3 w-3" />
        </a>{' '}
        or{' '}
        <button
          type="button"
          onClick={() => {
            onBeforeUploadModel?.()
            setModelId(UPLOAD_MODEL_MODEL.id)
          }}
          className="text-brand-green-text hover:underline"
        >
          upload your own model
        </button>{' '}
        to Runware to get an AIR ID.
      </p>

      {value.map((lora, index) => (
        <div key={index} className="rounded-md border border-neutral-70 bg-input p-2.5">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={lora.model}
              onChange={(e) => onUpdate(index, { model: e.target.value })}
              placeholder="civitai:757042@2502491"
              className="min-w-0 flex-1 rounded-md border border-neutral-70 bg-card px-2.5 py-1.5 font-mono text-sm text-neutral-5 placeholder-neutral-50 outline-none focus:border-brand-green-text"
            />
            <button
              type="button"
              onClick={() => onRemove(index)}
              aria-label="Remove LoRA"
              className="shrink-0 rounded-md p-1.5 text-neutral-40 transition-colors hover:bg-neutral-80 hover:text-brand-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="mt-2.5">
            <NumericSlider
              label="Weight"
              value={lora.weight ?? 1}
              min={0}
              max={2}
              step={0.05}
              onChange={(v) => onUpdate(index, { weight: v })}
            />
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={onAdd}
        disabled={value.length >= max}
        className="flex items-center justify-center gap-1.5 rounded-md border border-dashed border-neutral-70 bg-input py-2 text-xs font-medium text-neutral-30 transition-colors hover:bg-neutral-80 hover:text-neutral-5 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Plus className="h-3.5 w-3.5" />
        Add LoRA
      </button>
    </div>
  )
}
