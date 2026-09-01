import { useState } from 'react'
import { FolderCog, ImagePlus, X } from 'lucide-react'
import {
  usePromptStudioStore,
  type PromptStudioEntry,
  type PromptEntryKind,
} from '../store/promptStudio.store'
import { useMyMediaStore } from '../store/myMedia.store'
import { useGenerationStore } from '../store/generation.store'
import { MODELS, MANAGE_MEDIA_MODEL, type Ecosystem } from '../lib/models'
import type { RunwareLora } from '../lib/runware/types'
import { LoraSettings } from './models/z-image/LoraSettings'
import { Modal } from './Modal'
import { CopyButton } from './CopyButton'

const ECOSYSTEM_OPTIONS: { value: Ecosystem | ''; label: string }[] = [
  { value: '', label: 'None' },
  { value: 'z-image', label: 'Z-Image' },
  { value: 'flux', label: 'FLUX' },
  { value: 'seedream', label: 'Seedream' },
  { value: 'sdxl-anime', label: 'SDXL / Pony / Illustrious' },
  { value: 'sd15', label: 'SD1.5' },
  { value: 'minimax-video', label: 'MiniMax (video)' },
]

const MODEL_OPTIONS = MODELS.filter((m) => !m.hidden && m.ecosystem)

const MAX_LORAS = 5

export interface PromptEntryInitialDraft {
  title?: string
  positiveText?: string
  negativeText?: string
  ecosystem?: Ecosystem | null
  modelId?: string | null
  lora?: RunwareLora[]
  exampleMediaUUIDs?: string[]
}

export function PromptEntryEditorModal({
  entry,
  initialDraft,
  onClose,
}: {
  /** null = creating a new entry. */
  entry: PromptStudioEntry | null
  /** Pre-fills a new entry (e.g. from "Add to Prompt Studio" on a result) — ignored when editing
   *  an existing entry. */
  initialDraft?: PromptEntryInitialDraft
  onClose: () => void
}) {
  const addEntry = usePromptStudioStore((s) => s.addEntry)
  const updateEntry = usePromptStudioStore((s) => s.updateEntry)
  const attachExampleMedia = usePromptStudioStore((s) => s.attachExampleMedia)
  const removeExampleMedia = usePromptStudioStore((s) => s.removeExampleMedia)
  // `entry` is a snapshot passed in when the modal opened — re-read the live version from the
  // store so removing/attaching example media (or any other edit) is reflected immediately
  // instead of needing to close and reopen the modal.
  const liveEntry = usePromptStudioStore((s) => (entry ? (s.entries.find((e) => e.id === entry.id) ?? entry) : null))
  const mediaItems = useMyMediaStore((s) => s.items)
  const switchModel = useGenerationStore((s) => s.setModelId)
  const [showMediaPicker, setShowMediaPicker] = useState(false)

  const [title, setTitle] = useState(entry?.title ?? initialDraft?.title ?? '')
  const [positiveText, setPositiveText] = useState(entry?.positiveText ?? initialDraft?.positiveText ?? '')
  const [negativeText, setNegativeText] = useState(entry?.negativeText ?? initialDraft?.negativeText ?? '')
  const [kind, setKind] = useState<PromptEntryKind>(entry?.kind ?? 'full')
  const [ecosystem, setEcosystem] = useState<Ecosystem | ''>(entry?.ecosystem ?? initialDraft?.ecosystem ?? '')
  const [modelId, setModelId] = useState(entry?.modelId ?? initialDraft?.modelId ?? '')
  const [lora, setLora] = useState<RunwareLora[]>(entry?.lora ?? initialDraft?.lora ?? [])
  const [tags, setTags] = useState<string[]>(entry?.tags ?? [])
  const [tagDraft, setTagDraft] = useState('')

  const isEditing = entry !== null

  function commitTag() {
    const trimmed = tagDraft.trim()
    if (trimmed && !tags.includes(trimmed)) setTags([...tags, trimmed])
    setTagDraft('')
  }

  function handleSave() {
    if (!positiveText.trim()) return
    const draft = {
      title: title.trim() || positiveText.slice(0, 40),
      positiveText,
      negativeText,
      kind,
      ecosystem: ecosystem || null,
      modelId: modelId || null,
      lora,
      tags,
    }
    if (isEditing) {
      updateEntry(entry.id, draft)
    } else {
      const created = addEntry(draft)
      for (const mediaUUID of initialDraft?.exampleMediaUUIDs ?? []) {
        attachExampleMedia(created.id, mediaUUID)
      }
    }
    onClose()
  }

  return (
    <Modal title={isEditing ? 'Edit prompt' : 'New prompt'} onClose={onClose} widthClassName="max-w-2xl">
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-neutral-40">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Moody cyberpunk portrait"
            className="w-full rounded-md border border-neutral-70 bg-input px-3 py-2 text-sm text-neutral-5 placeholder-neutral-50 outline-none focus:border-brand-green-text"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-neutral-40">
            Kind
          </label>
          <div className="flex gap-1.5">
            {(['full', 'fragment'] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium capitalize transition-colors ${
                  kind === k
                    ? 'border-brand-green-text bg-brand-green/10 text-brand-green-text'
                    : 'border-neutral-70 text-neutral-30 hover:bg-neutral-80 hover:text-neutral-5'
                }`}
              >
                {k}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-neutral-40">
            {kind === 'full'
              ? 'A complete prompt — loading it replaces the whole box.'
              : 'A reusable piece (style clause, quality tags, a character description) — loading it inserts at the cursor instead of replacing the box.'}
          </p>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <label className="text-xs font-medium uppercase tracking-wide text-neutral-40">Prompt</label>
            <CopyButton text={positiveText} label="Copy prompt" iconClassName="h-3.5 w-3.5" />
          </div>
          <textarea
            value={positiveText}
            onChange={(e) => setPositiveText(e.target.value)}
            rows={4}
            required
            className="w-full resize-none rounded-md border border-neutral-70 bg-input px-3 py-2 text-sm text-neutral-5 placeholder-neutral-50 outline-none focus:border-brand-green-text"
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <label className="text-xs font-medium uppercase tracking-wide text-neutral-40">
              Negative prompt
            </label>
            <CopyButton text={negativeText} label="Copy negative prompt" iconClassName="h-3.5 w-3.5" />
          </div>
          <textarea
            value={negativeText}
            onChange={(e) => setNegativeText(e.target.value)}
            rows={2}
            className="w-full resize-none rounded-md border border-neutral-70 bg-input px-3 py-2 text-sm text-neutral-5 placeholder-neutral-50 outline-none focus:border-brand-green-text"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-neutral-40">
              Ecosystem
            </label>
            <select
              value={ecosystem}
              onChange={(e) => setEcosystem(e.target.value as Ecosystem | '')}
              className="w-full rounded-md border border-neutral-70 bg-input px-2.5 py-1.5 text-sm text-neutral-5 outline-none focus:border-brand-green-text"
            >
              {ECOSYSTEM_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-neutral-40">
              Model (optional)
            </label>
            <select
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
              className="w-full rounded-md border border-neutral-70 bg-input px-2.5 py-1.5 text-sm text-neutral-5 outline-none focus:border-brand-green-text"
            >
              <option value="">Any model in this ecosystem</option>
              {MODEL_OPTIONS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-neutral-40">
            Tags
          </label>
          <div className="mb-1.5 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 rounded bg-neutral-80 px-2 py-1 text-xs text-neutral-20"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => setTags(tags.filter((t) => t !== tag))}
                  aria-label={`Remove tag ${tag}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
          <input
            type="text"
            value={tagDraft}
            onChange={(e) => setTagDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault()
                commitTag()
              }
            }}
            onBlur={commitTag}
            placeholder="Type a tag and press Enter…"
            className="w-full rounded-md border border-neutral-70 bg-input px-2.5 py-1.5 text-sm text-neutral-5 placeholder-neutral-50 outline-none focus:border-brand-green-text"
          />
        </div>

        {isEditing && liveEntry && (
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-neutral-40">
              Example images
            </label>
            <div className="flex flex-wrap gap-2">
              {liveEntry.exampleMediaUUIDs.map((uuid) => {
                const item = mediaItems.find((m) => m.mediaUUID === uuid)
                return (
                  <div key={uuid} className="group relative h-16 w-16 overflow-hidden rounded-md border border-neutral-70">
                    {item ? (
                      <img src={item.mediaURL} alt={item.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-input text-[10px] text-neutral-50">
                        Missing
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeExampleMedia(liveEntry.id, uuid)}
                      aria-label="Remove example image"
                      className="absolute inset-0 flex items-center justify-center bg-neutral-100/70 text-neutral-5 opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )
              })}
              <button
                type="button"
                onClick={() => setShowMediaPicker(true)}
                title="Attach from My Media"
                aria-label="Attach from My Media"
                className="flex h-16 w-16 items-center justify-center rounded-md border border-dashed border-neutral-70 text-neutral-40 hover:bg-neutral-80 hover:text-neutral-5"
              >
                <ImagePlus className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-neutral-40">
            LoRA (optional)
          </label>
          <LoraSettings
            value={lora}
            max={MAX_LORAS}
            onAdd={() => setLora([...lora, { model: '', weight: 1 }])}
            onUpdate={(index, patch) => setLora(lora.map((l, i) => (i === index ? { ...l, ...patch } : l)))}
            onRemove={(index) => setLora(lora.filter((_, i) => i !== index))}
            onBeforeUploadModel={onClose}
          />
        </div>

        <div className="flex justify-end gap-2 border-t border-neutral-70 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-neutral-70 bg-input px-4 py-2 text-sm font-medium text-neutral-30 hover:bg-neutral-80 hover:text-neutral-5"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!positiveText.trim()}
            className="rounded-md bg-brand-green px-4 py-2 text-sm font-semibold text-on-brand transition hover:bg-brand-green-mid disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isEditing ? 'Save changes' : 'Save prompt'}
          </button>
        </div>
      </div>

      {showMediaPicker && isEditing && liveEntry && (
        <Modal title="Attach from My Media" onClose={() => setShowMediaPicker(false)} widthClassName="max-w-2xl">
          {mediaItems.length > 0 && (
            <button
              type="button"
              onClick={() => {
                switchModel(MANAGE_MEDIA_MODEL.id)
                setShowMediaPicker(false)
                onClose()
              }}
              className="mb-3 flex items-center gap-1.5 text-xs text-brand-green-text hover:underline"
            >
              <FolderCog className="h-3.5 w-3.5" />
              Manage My Media
            </button>
          )}
          {mediaItems.length === 0 ? (
            <p className="py-6 text-center text-sm text-neutral-40">
              No media uploaded yet. Upload some from the{' '}
              <button
                type="button"
                onClick={() => {
                  switchModel(MANAGE_MEDIA_MODEL.id)
                  setShowMediaPicker(false)
                  onClose()
                }}
                className="text-brand-green-text hover:underline"
              >
                Manage Media
              </button>{' '}
              utility first.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {mediaItems.map((item) => (
                <button
                  key={item.mediaUUID}
                  type="button"
                  onClick={() => {
                    attachExampleMedia(liveEntry.id, item.mediaUUID)
                    setShowMediaPicker(false)
                  }}
                  className="group relative aspect-square overflow-hidden rounded-md border border-neutral-70 bg-input transition-colors hover:border-brand-green-text"
                >
                  <img src={item.mediaURL} alt={item.name} className="h-full w-full object-cover" />
                  <div className="absolute inset-x-0 bottom-0 truncate bg-neutral-100/70 px-1.5 py-1 text-[10px] text-neutral-5 backdrop-blur">
                    {item.name}
                  </div>
                </button>
              ))}
            </div>
          )}
        </Modal>
      )}
    </Modal>
  )
}
