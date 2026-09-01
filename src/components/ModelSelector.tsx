import { useEffect, useRef, useState } from 'react'
import { MODELS, type ModelDefinition } from '../lib/models'

interface ModelSelectorProps {
  value: string
  onChange: (modelId: string) => void
}

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

// Extra search terms per category, beyond the category label itself — lets "text2img",
// "img2img", etc. surface the right group without those words appearing anywhere else.
const CATEGORY_SEARCH_ALIASES: Record<ModelDefinition['taskType'], string[]> = {
  introduction: ['introduction', 'intro', 'help', 'getting started', 'welcome', 'guide'],
  imageInference: ['image', 'img', 'text2img', 'txt2img', 'text-to-image', 'img2img', 'image-to-image'],
  videoInference: ['video', 'text2video', 'txt2video', 'text-to-video', 'img2video', 'image-to-video'],
  upscale: ['utilities', 'utility', 'upscale', 'upscaling', 'upres'],
  removeBackground: [
    'utilities',
    'utility',
    'background',
    'remove background',
    'transparent',
    'rembg',
    'cutout',
  ],
  extractMetadata: [
    'utilities',
    'utility',
    'metadata',
    'extract metadata',
    'exif',
    'info',
    'png info',
  ],
  uploadModel: [
    'utilities',
    'utility',
    'upload',
    'upload model',
    'safetensors',
    'checkpoint',
    'lora',
    'air',
  ],
  manageMedia: [
    'utilities',
    'utility',
    'media',
    'manage media',
    'my media',
    'assets',
    'library',
    'storage',
  ],
}

function matchesSearch(model: ModelDefinition, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  if (model.label.toLowerCase().includes(q) || model.id.toLowerCase().includes(q)) return true
  const categoryLabel = CATEGORY_LABELS[model.taskType].toLowerCase()
  if (categoryLabel.includes(q)) return true
  return CATEGORY_SEARCH_ALIASES[model.taskType].some((alias) => alias.includes(q))
}

function groupByCategory(models: ModelDefinition[]): { label: string; models: ModelDefinition[] }[] {
  const groups: { label: string; models: ModelDefinition[] }[] = []
  for (const model of models) {
    const label = CATEGORY_LABELS[model.taskType]
    const group = groups.find((g) => g.label === label)
    if (group) group.models.push(model)
    else groups.push({ label, models: [model] })
  }
  return groups
}

export function ModelSelector({ value, onChange }: ModelSelectorProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  const selected = MODELS.find((m) => m.id === value) ?? MODELS[0]
  const filtered = MODELS.filter((m) => !m.hidden && m.taskType !== 'introduction' && matchesSearch(m, search))
  const groups = groupByCategory(filtered)
  const introduction = MODELS.find((m) => m.taskType === 'introduction')
  const showIntroduction = introduction && matchesSearch(introduction, search)

  useEffect(() => {
    if (!open) return
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title={selected.label}
        className="flex h-8 w-full items-center gap-1.5 rounded-md border border-neutral-70 bg-input px-2 text-left transition-colors hover:border-neutral-50"
      >
        <span className="shrink-0 border-r border-neutral-70 pr-1.5 text-xs font-medium text-neutral-40">
          Model
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-neutral-5">
          {selected.label}
        </span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`h-3.5 w-3.5 shrink-0 text-neutral-40 transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+4px)] z-20 w-full min-w-0 rounded-md border border-neutral-70 bg-card p-2 shadow-xl sm:min-w-[280px]">
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search models…"
            className="mb-2 w-full rounded-md border border-neutral-70 bg-input px-2.5 py-1.5 text-sm text-neutral-5 placeholder-neutral-50 outline-none focus:border-brand-green-text"
          />
          <div className="max-h-[28rem] overflow-y-auto">
            {filtered.length === 0 && !showIntroduction && (
              <p className="px-2 py-3 text-center text-sm text-neutral-40">No models match.</p>
            )}
            {showIntroduction && introduction && (
              <div className="mb-2 border-b border-neutral-70 pb-2">
                <ModelOption
                  model={introduction}
                  selected={introduction.id === value}
                  onSelect={() => {
                    onChange(introduction.id)
                    setOpen(false)
                    setSearch('')
                  }}
                />
              </div>
            )}
            {groups.map((group, i) => (
              <div key={group.label}>
                <div
                  className={`flex items-center gap-2 px-2.5 pb-1 text-[11px] font-semibold tracking-wide text-neutral-40 uppercase ${
                    i > 0 ? 'mt-2 border-t border-neutral-70 pt-2' : ''
                  }`}
                >
                  {group.label}
                </div>
                {group.models.map((model) => (
                  <ModelOption
                    key={model.id}
                    model={model}
                    selected={model.id === value}
                    onSelect={() => {
                      onChange(model.id)
                      setOpen(false)
                      setSearch('')
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ModelOption({
  model,
  selected,
  onSelect,
}: {
  model: ModelDefinition
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-2 text-left transition-colors ${
        selected ? 'bg-brand-green/10' : 'hover:bg-neutral-80'
      }`}
    >
      <div className="min-w-0">
        <p className={`text-sm ${selected ? 'font-semibold text-brand-green-text' : 'text-neutral-5'}`}>
          {model.label}
        </p>
        <p className="truncate text-xs text-neutral-40">{model.description}</p>
      </div>
      {selected && (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="h-4 w-4 shrink-0 text-brand-green-text"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 6 9 17l-5-5" />
        </svg>
      )}
    </button>
  )
}
