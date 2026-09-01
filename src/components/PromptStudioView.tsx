import { useEffect, useMemo, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { usePromptStudioStore, type PromptStudioEntry } from '../store/promptStudio.store'
import { useMyMediaStore } from '../store/myMedia.store'
import { useGenerationStore } from '../store/generation.store'
import type { Ecosystem } from '../lib/models'
import { Select } from './Select'
import { Modal } from './Modal'
import { PromptEntryEditorModal } from './PromptEntryEditorModal'
import { CopyButton } from './CopyButton'

const ECOSYSTEM_LABELS: Record<Ecosystem, string> = {
  'z-image': 'Z-Image',
  flux: 'FLUX',
  seedream: 'Seedream',
  'sdxl-anime': 'SDXL / Pony / Illustrious',
  sd15: 'SD1.5',
  'minimax-video': 'MiniMax (video)',
}

const ECOSYSTEM_FILTER_ALL = 'All ecosystems'
const KIND_FILTER_ALL = 'All kinds'
const KIND_FILTER_OPTIONS = [KIND_FILTER_ALL, 'full', 'fragment'] as const
const SORT_OPTIONS = ['Newest', 'Oldest', 'Most used', 'A–Z'] as const
type SortOption = (typeof SORT_OPTIONS)[number]

function sortEntries(entries: PromptStudioEntry[], sort: SortOption): PromptStudioEntry[] {
  const sorted = [...entries]
  switch (sort) {
    case 'Newest':
      return sorted.sort((a, b) => b.createdAt - a.createdAt)
    case 'Oldest':
      return sorted.sort((a, b) => a.createdAt - b.createdAt)
    case 'Most used':
      return sorted.sort((a, b) => b.usageCount - a.usageCount)
    case 'A–Z':
      return sorted.sort((a, b) => a.title.localeCompare(b.title))
  }
}

export function PromptStudioView() {
  const entries = usePromptStudioStore((s) => s.entries)
  const deleteEntry = usePromptStudioStore((s) => s.deleteEntry)
  const pendingEditEntryId = usePromptStudioStore((s) => s.pendingEditEntryId)
  const clearPendingEdit = usePromptStudioStore((s) => s.clearPendingEdit)
  const mediaItems = useMyMediaStore((s) => s.items)
  const setMainView = useGenerationStore((s) => s.setMainView)

  const [search, setSearch] = useState('')
  const [ecosystemFilter, setEcosystemFilter] = useState<string>(ECOSYSTEM_FILTER_ALL)
  const [kindFilter, setKindFilter] = useState<(typeof KIND_FILTER_OPTIONS)[number]>(KIND_FILTER_ALL)
  const [sort, setSort] = useState<SortOption>('Newest')
  const [editingEntry, setEditingEntry] = useState<PromptStudioEntry | 'new' | null>(null)
  const [deletingEntry, setDeletingEntry] = useState<PromptStudioEntry | null>(null)

  useEffect(() => {
    if (!pendingEditEntryId) return
    const target = entries.find((e) => e.id === pendingEditEntryId)
    if (target) setEditingEntry(target)
    clearPendingEdit()
  }, [pendingEditEntryId, entries, clearPendingEdit])

  const ecosystemOptions = useMemo(() => {
    const used = [...new Set(entries.map((e) => e.ecosystem).filter((e): e is Ecosystem => e !== null))]
    return [ECOSYSTEM_FILTER_ALL, ...used.map((e) => ECOSYSTEM_LABELS[e])]
  }, [entries])

  const filteredEntries = useMemo(() => {
    const q = search.trim().toLowerCase()
    const filtered = entries.filter((e) => {
      if (kindFilter !== KIND_FILTER_ALL && e.kind !== kindFilter) return false
      if (ecosystemFilter !== ECOSYSTEM_FILTER_ALL && (!e.ecosystem || ECOSYSTEM_LABELS[e.ecosystem] !== ecosystemFilter))
        return false
      if (!q) return true
      return (
        e.title.toLowerCase().includes(q) ||
        e.positiveText.toLowerCase().includes(q) ||
        e.negativeText.toLowerCase().includes(q) ||
        e.tags.some((t) => t.toLowerCase().includes(q))
      )
    })
    return sortEntries(filtered, sort)
  }, [entries, search, ecosystemFilter, kindFilter, sort])

  const activeFilterCount = [ecosystemFilter !== ECOSYSTEM_FILTER_ALL, kindFilter !== KIND_FILTER_ALL].filter(
    Boolean,
  ).length

  return (
    <div className="flex h-full flex-col">
      <button
        type="button"
        onClick={() => setMainView('gallery')}
        className="border-b border-neutral-70 bg-card px-4 py-1.5 text-center text-xs text-neutral-40 transition-colors hover:bg-neutral-80 hover:text-neutral-20"
      >
        You're viewing the Prompt Studio — click here to return to the Generation Results.
      </button>
      <div className="flex flex-wrap items-end gap-2 border-b border-neutral-70 bg-card px-4 py-2">
        <div className="w-56">
          <label className="mb-1.5 block text-xs font-medium text-neutral-20">Search</label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Title, prompt text, or tag…"
            className="w-full rounded-md border border-neutral-70 bg-input px-2.5 py-1.5 text-sm text-neutral-5 placeholder-neutral-50 outline-none focus:border-brand-green-text"
          />
        </div>
        <div className="w-48">
          <Select label="Ecosystem" value={ecosystemFilter} options={ecosystemOptions} onChange={setEcosystemFilter} />
        </div>
        <div className="w-36">
          <Select label="Kind" value={kindFilter} options={KIND_FILTER_OPTIONS} onChange={setKindFilter} />
        </div>
        <div className="w-40">
          <Select label="Sort by" value={sort} options={SORT_OPTIONS} onChange={setSort} />
        </div>
        {activeFilterCount > 0 && (
          <button
            onClick={() => {
              setEcosystemFilter(ECOSYSTEM_FILTER_ALL)
              setKindFilter(KIND_FILTER_ALL)
            }}
            className="rounded-md px-2.5 py-1.5 text-xs font-medium text-neutral-40 hover:text-neutral-20"
          >
            Clear filters
          </button>
        )}
        <button
          type="button"
          onClick={() => setEditingEntry('new')}
          className="ml-auto flex items-center gap-1.5 self-center rounded-md bg-brand-green px-3 py-2 text-sm font-semibold text-on-brand hover:bg-brand-green-mid"
        >
          <Plus className="h-4 w-4" />
          New prompt
        </button>
        <span className="hidden self-center font-mono text-xs text-neutral-50 md:inline">
          {filteredEntries.length}/{entries.length}
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {entries.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-neutral-40">
            <p className="text-sm">Nothing saved yet.</p>
            <p className="text-xs">
              Save whole prompts or reusable fragments here, or use "Add to Prompt Studio" on any result.
            </p>
          </div>
        ) : filteredEntries.length === 0 ? (
          <p className="py-6 text-center text-sm text-neutral-40">No prompts match these filters.</p>
        ) : (
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, 220px)' }}>
            {filteredEntries.map((entry) => (
              <PromptEntryCard
                key={entry.id}
                entry={entry}
                thumbnailUrl={
                  entry.exampleMediaUUIDs.length > 0
                    ? mediaItems.find((m) => m.mediaUUID === entry.exampleMediaUUIDs[0])?.mediaURL
                    : undefined
                }
                onEdit={() => setEditingEntry(entry)}
                onDelete={() => setDeletingEntry(entry)}
              />
            ))}
          </div>
        )}
      </div>

      {editingEntry && (
        <PromptEntryEditorModal
          entry={editingEntry === 'new' ? null : editingEntry}
          onClose={() => setEditingEntry(null)}
        />
      )}

      {deletingEntry && (
        <Modal title="Delete prompt" onClose={() => setDeletingEntry(null)}>
          <div className="space-y-3">
            <p className="text-sm text-neutral-20">
              Delete "{deletingEntry.title}" from Prompt Studio? This can't be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeletingEntry(null)}
                className="rounded-md border border-neutral-70 bg-input px-3 py-2 text-sm font-medium text-neutral-30 hover:bg-neutral-80 hover:text-neutral-5"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteEntry(deletingEntry.id)
                  setDeletingEntry(null)
                }}
                className="rounded-md bg-brand-destructive/10 px-3 py-2 text-sm font-medium text-brand-destructive hover:bg-brand-destructive/20"
              >
                Delete
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

function PromptEntryCard({
  entry,
  thumbnailUrl,
  onEdit,
  onDelete,
}: {
  entry: PromptStudioEntry
  thumbnailUrl?: string
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className="flex flex-col overflow-hidden rounded-md border border-neutral-70 bg-card">
      <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden bg-bg">
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt={entry.title} className="h-full w-full object-cover" />
        ) : (
          <p className="line-clamp-6 px-3 text-center text-xs text-neutral-50">{entry.positiveText}</p>
        )}
        <span
          className={`absolute right-2 top-2 rounded bg-neutral-100/80 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide backdrop-blur ${
            entry.kind === 'fragment' ? 'text-brand-yellow' : 'text-brand-green'
          }`}
        >
          {entry.kind}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <p className="min-w-0 truncate text-sm font-medium text-neutral-5">{entry.title || 'Untitled'}</p>
        {thumbnailUrl && <p className="line-clamp-2 text-xs text-neutral-40">{entry.positiveText}</p>}
        {entry.ecosystem && <p className="text-[11px] text-neutral-50">{ECOSYSTEM_LABELS[entry.ecosystem]}</p>}
        {entry.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {entry.tags.map((tag) => (
              <span key={tag} className="rounded bg-neutral-80 px-1.5 py-0.5 text-[10px] text-neutral-30">
                {tag}
              </span>
            ))}
          </div>
        )}
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-[11px] text-neutral-50">
            {entry.usageCount > 0 ? `Used ${entry.usageCount}×` : 'Never used'}
          </span>
          <div className="flex gap-1">
            <CopyButton text={entry.positiveText} label="Copy prompt" />
            <button
              type="button"
              onClick={onEdit}
              aria-label="Edit"
              title="Edit"
              className="rounded-md p-1.5 text-neutral-40 hover:bg-neutral-80 hover:text-neutral-5"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={onDelete}
              aria-label="Delete"
              title="Delete"
              className="rounded-md p-1.5 text-neutral-40 hover:bg-neutral-80 hover:text-brand-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
