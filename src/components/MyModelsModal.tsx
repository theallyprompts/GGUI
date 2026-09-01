import { useEffect, useMemo, useState } from 'react'
import { Check, ChevronLeft, ChevronRight, Copy, RefreshCw } from 'lucide-react'
import { useApiKeyStore } from '../store/apiKey.store'
import { useMyModelsStore } from '../store/myModels.store'
import { UPLOAD_MODEL_CATEGORY_LABELS } from '../lib/models/uploadModelArchitectures'
import type { ModelSearchResultItem } from '../lib/runware/types'
import { Modal } from './Modal'
import { Select } from './Select'

const PAGE_SIZE = 10
const ARCHITECTURE_FILTER_ALL = 'All ecosystems'

export function MyModelsModal({ onClose }: { onClose: () => void }) {
  const apiKey = useApiKeyStore((s) => s.apiKey)
  const models = useMyModelsStore((s) => s.models)
  const isLoading = useMyModelsStore((s) => s.isLoading)
  const error = useMyModelsStore((s) => s.error)
  const fetchModels = useMyModelsStore((s) => s.fetchModels)

  const [search, setSearch] = useState('')
  const [architectureFilter, setArchitectureFilter] = useState(ARCHITECTURE_FILTER_ALL)
  const [page, setPage] = useState(1)

  useEffect(() => {
    if (apiKey) void fetchModels(apiKey)
  }, [apiKey, fetchModels])

  useEffect(() => {
    setPage(1)
  }, [search, architectureFilter])

  const architectureOptions = useMemo(() => {
    const used = [...new Set((models ?? []).map((m) => m.architecture).filter((a): a is string => Boolean(a)))]
    used.sort((a, b) => a.localeCompare(b))
    return [ARCHITECTURE_FILTER_ALL, ...used]
  }, [models])

  const filteredModels = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (models ?? []).filter((m) => {
      if (architectureFilter !== ARCHITECTURE_FILTER_ALL && m.architecture !== architectureFilter) return false
      if (q && !m.name.toLowerCase().includes(q)) return false
      return true
    })
  }, [models, search, architectureFilter])

  const pageCount = Math.max(1, Math.ceil(filteredModels.length / PAGE_SIZE))
  const clampedPage = Math.min(page, pageCount)
  const pagedModels = filteredModels.slice((clampedPage - 1) * PAGE_SIZE, clampedPage * PAGE_SIZE)

  if (!apiKey) {
    return (
      <Modal title="My uploaded models" onClose={onClose} widthClassName="max-w-lg">
        <p className="py-6 text-center text-sm text-neutral-40">No API key set.</p>
      </Modal>
    )
  }

  return (
    <Modal title="My uploaded models" onClose={onClose} widthClassName="max-w-2xl">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs text-neutral-40">
            Models you've uploaded to Runware. Runware doesn't report an upload date or processing
            status here — check the "Upload Model" utility's result for that right after uploading.
          </p>
          <button
            onClick={() => void fetchModels(apiKey)}
            disabled={isLoading}
            title="Refresh"
            aria-label="Refresh"
            className="ml-3 shrink-0 rounded-md border border-neutral-70 bg-input p-2 text-neutral-30 transition-colors hover:bg-neutral-80 hover:text-neutral-5 disabled:cursor-wait"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <p className="rounded-md border border-brand-yellow/40 bg-brand-yellow/10 px-3 py-2 text-xs text-brand-yellow-text">
          This query is quite slow on Runware's side — it can take a while for newly uploaded
          models to appear here, so don't worry if a recent upload isn't showing yet.
        </p>

        {isLoading && !models && <p className="py-6 text-center text-sm text-neutral-40">Loading…</p>}

        {error && (
          <p className="rounded-md border border-brand-destructive/30 bg-brand-destructive/10 p-3 text-sm text-brand-destructive">
            {error}
          </p>
        )}

        {models && models.length === 0 && (
          <p className="py-6 text-center text-sm text-neutral-40">
            No uploaded models found. Use the "Upload Model" utility to register one.
          </p>
        )}

        {models && models.length > 0 && (
          <>
            <div className="flex flex-wrap items-end gap-2">
              <div className="w-52">
                <label className="mb-1.5 block text-xs font-medium text-neutral-20">Search</label>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name…"
                  className="w-full rounded-md border border-neutral-70 bg-input px-2.5 py-1.5 text-sm text-neutral-5 placeholder-neutral-50 outline-none focus:border-brand-green-text"
                />
              </div>
              <div className="w-44">
                <Select
                  label="Ecosystem"
                  value={architectureFilter}
                  options={architectureOptions}
                  onChange={setArchitectureFilter}
                />
              </div>
              <span className="ml-auto self-center font-mono text-xs text-neutral-50">
                {filteredModels.length}/{models.length}
              </span>
            </div>

            {filteredModels.length === 0 ? (
              <p className="py-6 text-center text-sm text-neutral-40">No models match these filters.</p>
            ) : (
              <>
                <div className="divide-y divide-neutral-70 rounded-md border border-neutral-70">
                  {pagedModels.map((model) => (
                    <ModelRow key={model.air} model={model} />
                  ))}
                </div>

                {pageCount > 1 && (
                  <div className="flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={clampedPage <= 1}
                      aria-label="Previous page"
                      className="rounded-md border border-neutral-70 bg-input p-1.5 text-neutral-30 hover:bg-neutral-80 hover:text-neutral-5 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="font-mono text-xs text-neutral-40">
                      Page {clampedPage} of {pageCount}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                      disabled={clampedPage >= pageCount}
                      aria-label="Next page"
                      className="rounded-md border border-neutral-70 bg-input p-1.5 text-neutral-30 hover:bg-neutral-80 hover:text-neutral-5 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </Modal>
  )
}

function ModelRow({ model }: { model: ModelSearchResultItem }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(model.air)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard access denied or unavailable — nothing more we can do.
    }
  }

  const categoryLabel = UPLOAD_MODEL_CATEGORY_LABELS[model.category] ?? model.category

  return (
    <div className="flex items-center justify-between gap-3 p-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-neutral-5">{model.name}</p>
        <div className="flex items-center gap-1.5">
          <p className="truncate font-mono text-xs text-neutral-40">{model.air}</p>
          <button
            onClick={handleCopy}
            title="Copy AIR"
            aria-label="Copy AIR"
            className="shrink-0 text-neutral-40 transition-colors hover:text-neutral-5"
          >
            {copied ? <Check className="h-3 w-3 text-brand-green-text" /> : <Copy className="h-3 w-3" />}
          </button>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2 text-xs">
        <span className="rounded-md border border-neutral-70 bg-input px-2 py-1 text-neutral-30">
          {categoryLabel}
        </span>
        {model.architecture && (
          <span className="rounded-md border border-neutral-70 bg-input px-2 py-1 text-neutral-30">
            {model.architecture}
          </span>
        )}
        {model.private && (
          <span className="rounded-md border border-neutral-70 bg-input px-2 py-1 text-neutral-30">
            Private
          </span>
        )}
      </div>
    </div>
  )
}
