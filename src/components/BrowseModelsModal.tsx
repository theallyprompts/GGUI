import { useMemo, useState } from 'react'
import { MODELS, type ModelDefinition } from '../lib/models'
import { useGenerationStore } from '../store/generation.store'
import { Modal } from './Modal'

/** Modality filter shown as tabs — kept in sync with ModelSelector's CATEGORY_LABELS grouping,
 *  since this modal is meant to be the "browse everything" counterpart to that dropdown. */
const CATEGORY_LABELS: Record<ModelDefinition['taskType'], string> = {
  introduction: 'Introduction',
  imageInference: 'Image',
  videoInference: 'Video',
  upscale: 'Utilities',
  removeBackground: 'Utilities',
  extractMetadata: 'Utilities',
  uploadModel: 'Utilities',
  manageMedia: 'Utilities',
}

const FILTER_ALL = 'All'

interface BrowseModelsModalProps {
  onClose: () => void
  /** Preselects a modality tab when opened from a specific "Browse Image models" style link. */
  initialCategory?: string
}

export function BrowseModelsModal({ onClose, initialCategory }: BrowseModelsModalProps) {
  const setModelId = useGenerationStore((s) => s.setModelId)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<string>(initialCategory ?? FILTER_ALL)

  const browsable = useMemo(
    () => MODELS.filter((m) => !m.hidden && m.taskType !== 'introduction'),
    [],
  )

  const categories = useMemo(() => {
    const used = [...new Set(browsable.map((m) => CATEGORY_LABELS[m.taskType]))]
    return [FILTER_ALL, ...used]
  }, [browsable])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return browsable.filter((m) => {
      if (category !== FILTER_ALL && CATEGORY_LABELS[m.taskType] !== category) return false
      if (!q) return true
      return m.label.toLowerCase().includes(q) || m.description.toLowerCase().includes(q)
    })
  }, [browsable, search, category])

  return (
    <Modal title="Browse models" onClose={onClose} widthClassName="max-w-xl">
      <div className="space-y-3">
        <input
          autoFocus
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search models…"
          className="w-full rounded-md border border-neutral-70 bg-input px-2.5 py-1.5 text-sm text-neutral-5 placeholder-neutral-50 outline-none focus:border-brand-green-text"
        />

        <div className="flex flex-wrap gap-1.5">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                category === c
                  ? 'border-brand-green-text bg-brand-green/10 text-brand-green-text'
                  : 'border-neutral-70 text-neutral-30 hover:bg-neutral-80 hover:text-neutral-5'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <p className="py-6 text-center text-sm text-neutral-40">No models match.</p>
        ) : (
          <div className="max-h-96 space-y-1.5 overflow-y-auto">
            {filtered.map((model) => (
              <button
                key={model.id}
                type="button"
                onClick={() => {
                  setModelId(model.id)
                  onClose()
                }}
                className="flex w-full items-start justify-between gap-2 rounded-md border border-neutral-70 bg-input p-2.5 text-left transition-colors hover:border-brand-green-text hover:bg-brand-green/5"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-neutral-5">{model.label}</p>
                  <p className="line-clamp-2 text-xs text-neutral-40">{model.description}</p>
                </div>
                <span className="shrink-0 rounded bg-neutral-80 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-40">
                  {CATEGORY_LABELS[model.taskType]}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}
