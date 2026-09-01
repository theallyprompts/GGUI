import { useMemo, useState } from 'react'
import { Check, Copy, Loader2, Pencil, Trash2 } from 'lucide-react'
import { useApiKeyStore } from '../../../store/apiKey.store'
import { useMyMediaStore, type MyMediaItem } from '../../../store/myMedia.store'
import { Select } from '../../Select'

const DATE_FILTER_OPTIONS = ['All time', 'Today', 'Last 7 days', 'Last 30 days'] as const
type DateFilterOption = (typeof DATE_FILTER_OPTIONS)[number]

const DAY_MS = 24 * 60 * 60 * 1000

function withinDateFilter(addedAt: number, filter: DateFilterOption): boolean {
  if (filter === 'All time') return true
  const now = Date.now()
  const days = filter === 'Today' ? 1 : filter === 'Last 7 days' ? 7 : 30
  return addedAt >= now - days * DAY_MS
}

export function ManageMediaGallery() {
  const apiKey = useApiKeyStore((s) => s.apiKey)
  const items = useMyMediaStore((s) => s.items)
  const removeMedia = useMyMediaStore((s) => s.removeMedia)

  const [nameFilter, setNameFilter] = useState('')
  const [dateFilter, setDateFilter] = useState<DateFilterOption>('All time')
  const [deletingUUID, setDeletingUUID] = useState<string | null>(null)

  const filteredItems = useMemo(() => {
    const q = nameFilter.trim().toLowerCase()
    return items.filter(
      (item) => (!q || item.name.toLowerCase().includes(q)) && withinDateFilter(item.addedAt, dateFilter),
    )
  }, [items, nameFilter, dateFilter])

  async function handleDelete(item: MyMediaItem) {
    if (!apiKey) return
    if (!confirm(`Remove "${item.name}" from your media library? This deletes it from Runware too.`)) return
    setDeletingUUID(item.mediaUUID)
    await removeMedia(apiKey, item.mediaUUID)
    setDeletingUUID(null)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-end gap-2 border-b border-neutral-70 bg-card px-4 py-2">
        <div className="w-48">
          <label className="mb-1.5 block text-xs font-medium text-neutral-20">Name</label>
          <input
            type="text"
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            placeholder="Search by name…"
            className="w-full rounded-md border border-neutral-70 bg-input px-2.5 py-1.5 text-sm text-neutral-5 placeholder-neutral-50 outline-none focus:border-brand-green-text"
          />
        </div>
        <div className="w-36">
          <Select label="Added" value={dateFilter} options={DATE_FILTER_OPTIONS} onChange={setDateFilter} />
        </div>
        <span className="ml-auto self-center font-mono text-xs text-neutral-50">
          {filteredItems.length}/{items.length}
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {items.length === 0 ? (
          <p className="py-6 text-center text-sm text-neutral-40">
            No media uploaded yet. Use the panel on the left to upload assets for quick reuse across the
            generator.
          </p>
        ) : filteredItems.length === 0 ? (
          <p className="py-6 text-center text-sm text-neutral-40">No media matches these filters.</p>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
            {filteredItems.map((item) => (
              <MediaTile
                key={item.mediaUUID}
                item={item}
                deleting={deletingUUID === item.mediaUUID}
                onDelete={() => void handleDelete(item)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function MediaTile({
  item,
  deleting,
  onDelete,
}: {
  item: MyMediaItem
  deleting: boolean
  onDelete: () => void
}) {
  const renameMedia = useMyMediaStore((s) => s.renameMedia)
  const isVideo = /\.(mp4|webm|mov)($|\?)/i.test(item.mediaURL)
  const [isRenaming, setIsRenaming] = useState(false)
  const [nameDraft, setNameDraft] = useState(item.name)
  const [copied, setCopied] = useState(false)

  function commitRename() {
    renameMedia(item.mediaUUID, nameDraft)
    setIsRenaming(false)
  }

  async function handleCopyUUID() {
    try {
      await navigator.clipboard.writeText(item.mediaUUID)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard access denied or unavailable — nothing more we can do.
    }
  }

  return (
    <div className="group relative aspect-square overflow-hidden rounded-md border border-neutral-70 bg-input">
      {isVideo ? (
        <video src={item.mediaURL} muted className="h-full w-full object-cover" />
      ) : (
        <img src={item.mediaURL} alt={item.name} className="h-full w-full object-cover" />
      )}

      {isRenaming ? (
        <input
          autoFocus
          value={nameDraft}
          onChange={(e) => setNameDraft(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitRename()
            if (e.key === 'Escape') {
              setNameDraft(item.name)
              setIsRenaming(false)
            }
          }}
          onClick={(e) => e.stopPropagation()}
          className="absolute inset-x-0 bottom-0 w-full bg-neutral-100 px-1.5 py-1 text-[10px] text-neutral-5 outline-none"
        />
      ) : (
        <button
          type="button"
          onClick={() => setIsRenaming(true)}
          title="Click to rename"
          className="absolute inset-x-0 bottom-0 truncate bg-neutral-100/70 px-1.5 py-1 text-left text-[10px] text-neutral-5 backdrop-blur hover:bg-neutral-100/90"
        >
          {item.name}
        </button>
      )}

      <div className="absolute right-1 top-1 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
        <button
          type="button"
          onClick={() => setIsRenaming(true)}
          aria-label={`Rename ${item.name}`}
          title="Rename"
          className="rounded-md bg-neutral-90/80 p-1.5 text-neutral-5 backdrop-blur transition-colors hover:bg-neutral-90"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => void handleCopyUUID()}
          aria-label={`Copy UUID for ${item.name}`}
          title="Copy UUID"
          className="rounded-md bg-neutral-90/80 p-1.5 text-neutral-5 backdrop-blur transition-colors hover:bg-neutral-90"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-brand-green-text" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={deleting}
          aria-label={`Delete ${item.name}`}
          title="Delete"
          className="rounded-md bg-neutral-90/80 p-1.5 text-neutral-5 backdrop-blur transition-colors hover:bg-brand-destructive disabled:cursor-wait"
        >
          {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  )
}
