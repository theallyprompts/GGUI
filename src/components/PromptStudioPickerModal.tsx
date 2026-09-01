import { useMemo, useState } from 'react'
import { ExternalLink, Pencil } from 'lucide-react'
import { usePromptStudioStore, type PromptStudioEntry } from '../store/promptStudio.store'
import { useGenerationStore } from '../store/generation.store'
import type { Ecosystem } from '../lib/models'
import { Modal } from './Modal'
import { CopyButton } from './CopyButton'

const ECOSYSTEM_LABELS: Record<Ecosystem, string> = {
  'z-image': 'Z-Image',
  flux: 'FLUX',
  seedream: 'Seedream',
  'sdxl-anime': 'SDXL / Pony / Illustrious',
  sd15: 'SD1.5',
  'minimax-video': 'MiniMax (video)',
}

interface PromptStudioPickerModalProps {
  onClose: () => void
  onSelect: (entry: PromptStudioEntry) => void
  /** Which field this picker is filling — used only to label the modal. */
  field: 'positive' | 'negative'
  /** The active model's ecosystem, if any — entries matching it sort first. */
  activeEcosystem?: Ecosystem
}

export function PromptStudioPickerModal({
  onClose,
  onSelect,
  field,
  activeEcosystem,
}: PromptStudioPickerModalProps) {
  const entries = usePromptStudioStore((s) => s.entries)
  const requestEdit = usePromptStudioStore((s) => s.requestEdit)
  const setMainView = useGenerationStore((s) => s.setMainView)
  const [search, setSearch] = useState('')

  function handleEdit(entry: PromptStudioEntry, e: React.MouseEvent) {
    e.stopPropagation()
    requestEdit(entry.id)
    setMainView('promptStudio')
    onClose()
  }

  const sorted = useMemo(() => {
    const q = search.trim().toLowerCase()
    const filtered = entries.filter(
      (e) =>
        !q ||
        e.title.toLowerCase().includes(q) ||
        e.positiveText.toLowerCase().includes(q) ||
        e.tags.some((t) => t.toLowerCase().includes(q)),
    )
    if (!activeEcosystem) return filtered
    return [...filtered].sort((a, b) => {
      const aMatch = a.ecosystem === activeEcosystem ? 0 : 1
      const bMatch = b.ecosystem === activeEcosystem ? 0 : 1
      return aMatch - bMatch
    })
  }, [entries, search, activeEcosystem])

  return (
    <Modal
      title="Load from Prompt Studio"
      onClose={onClose}
      widthClassName="max-w-lg"
      headerAction={
        <button
          type="button"
          onClick={() => {
            setMainView('promptStudio')
            onClose()
          }}
          title="Open Prompt Studio"
          aria-label="Open Prompt Studio"
          className="text-neutral-40 hover:text-brand-green-text"
        >
          <ExternalLink className="h-4 w-4" />
        </button>
      }
    >
      <div className="space-y-3">
        <input
          autoFocus
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search saved prompts…"
          className="w-full rounded-md border border-neutral-70 bg-input px-2.5 py-1.5 text-sm text-neutral-5 placeholder-neutral-50 outline-none focus:border-brand-green-text"
        />

        {sorted.length === 0 ? (
          <p className="py-6 text-center text-sm text-neutral-40">
            {entries.length === 0
              ? 'Nothing saved in Prompt Studio yet.'
              : 'No saved prompts match this search.'}
          </p>
        ) : (
          <div className="max-h-96 space-y-1.5 overflow-y-auto">
            {sorted.map((entry) => (
              <div
                key={entry.id}
                className="group relative rounded-md border border-neutral-70 bg-input transition-colors hover:border-brand-green-text"
              >
                <button
                  type="button"
                  onClick={() => {
                    onSelect(entry)
                    onClose()
                  }}
                  className="w-full p-2.5 pr-16 text-left"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="min-w-0 truncate text-sm font-medium text-neutral-5">{entry.title}</p>
                    <span
                      className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                        entry.kind === 'fragment'
                          ? 'bg-brand-yellow/10 text-brand-yellow-text'
                          : 'bg-brand-green/10 text-brand-green-text'
                      }`}
                    >
                      {entry.kind}
                    </span>
                  </div>
                  <p className="line-clamp-2 text-xs text-neutral-40">
                    {field === 'negative' && entry.negativeText ? entry.negativeText : entry.positiveText}
                  </p>
                  {entry.ecosystem && (
                    <p className="mt-0.5 text-[11px] text-neutral-50">{ECOSYSTEM_LABELS[entry.ecosystem]}</p>
                  )}
                </button>
                <div className="absolute right-2 top-2.5 flex gap-0.5">
                  <CopyButton
                    text={field === 'negative' && entry.negativeText ? entry.negativeText : entry.positiveText}
                    label="Copy prompt"
                    iconClassName="h-3.5 w-3.5"
                    className="rounded-md p-1 text-neutral-40 hover:bg-neutral-80 hover:text-neutral-5"
                  />
                  <button
                    type="button"
                    onClick={(e) => handleEdit(entry, e)}
                    aria-label={`Edit ${entry.title}`}
                    title="Edit in Prompt Studio"
                    className="rounded-md p-1 text-neutral-40 hover:bg-neutral-80 hover:text-neutral-5"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}
