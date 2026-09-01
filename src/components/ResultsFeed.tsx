import { useMemo, useState } from 'react'
import { zipSync } from 'fflate'
import {
  ArrowUpToLine,
  BookText,
  ChevronDown,
  Code,
  Columns2,
  Copy,
  Eraser,
  EyeOff,
  ExternalLink,
  Folder as FolderIcon,
  FolderPlus,
  ImageDown,
  LayoutGrid,
  Pencil,
  Repeat2,
  Rows3,
  SlidersHorizontal,
  Star,
  Trash2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import { useGenerationStore, isImageGenJob, type GenerationJob } from '../store/generation.store'
import { useUpscaleStore } from '../store/models/upscale.store'
import { useRembgStore } from '../store/models/rembg.store'
import { useMyMediaStore } from '../store/myMedia.store'
import { useApiKeyStore } from '../store/apiKey.store'
import { useFoldersStore } from '../store/folders.store'
import { setInputImageForModel, isMinimaxH3Model, setMinimaxH3Input } from '../store/models/dispatch'
import { UPSCALE_MODEL, REMBG_MODEL, MANAGE_MEDIA_MODEL, findModel } from '../lib/models'
import { Lightbox } from './Lightbox'
import { ImageActionsMenu } from './ImageActionsMenu'
import { UseAsInputModal } from './models/minimax-h3/UseAsInputModal'
import { ApiRequestModal } from './ApiRequestModal'
import { CompareModal } from './CompareModal'
import { EditImageModal } from './EditImageModal'
import { PromptEntryEditorModal, type PromptEntryInitialDraft } from './PromptEntryEditorModal'
import { Select } from './Select'
import { FolderRail, UNFILED_FOLDER_ID } from './FolderRail'
import { embedImageMetadata } from '../lib/imageMetadata'
import { serializeJobMetadata } from '../lib/imageMetadata/jobMetadata'
import { useThumbnail } from '../lib/useThumbnail'

function extensionFor(format: GenerationJob['outputFormat']): string {
  return format === 'JPG' ? 'jpg' : format.toLowerCase()
}

function mediaUrlFor(job: GenerationJob): string | undefined {
  return job.kind === 'videoInference' ? job.result?.videoURL : job.result?.imageURL
}

function dimensionsFor(job: GenerationJob): { width: number; height: number } | undefined {
  if (job.kind === 'upscale' || job.kind === 'removeBackground') return undefined
  return { width: job.width, height: job.height }
}

// Common generation aspect ratios. Actual pixel dimensions get snapped to model-specific
// multiples (8, 16, ...) so exact-fraction reduction (GCD) produces odd results like "51:77" —
// instead we snap to the closest of these canonical ratios.
const CANONICAL_ASPECT_RATIOS: { label: string; ratio: number }[] = [
  { label: '1:1', ratio: 1 / 1 },
  { label: '4:3', ratio: 4 / 3 },
  { label: '3:2', ratio: 3 / 2 },
  { label: '16:9', ratio: 16 / 9 },
  { label: '21:9', ratio: 21 / 9 },
  { label: '2:1', ratio: 2 / 1 },
  { label: '3:4', ratio: 3 / 4 },
  { label: '2:3', ratio: 2 / 3 },
  { label: '9:16', ratio: 9 / 16 },
  { label: '1:2', ratio: 1 / 2 },
]

/** Buckets a job's dimensions into the closest canonical aspect ratio label, for the aspect-ratio filter. */
function aspectRatioLabelFor(job: GenerationJob): string | undefined {
  const dims = dimensionsFor(job)
  if (!dims) return undefined
  const target = dims.width / dims.height
  return CANONICAL_ASPECT_RATIOS.reduce((closest, option) =>
    Math.abs(option.ratio - target) < Math.abs(closest.ratio - target) ? option : closest,
  ).label
}

const DATE_FILTER_OPTIONS = ['All time', 'Today', 'Yesterday', 'This week', 'This month', 'Custom range'] as const
type DateFilterOption = (typeof DATE_FILTER_OPTIONS)[number]

/** Start-of-day timestamp `daysAgo` days before now, in local time. */
function startOfDaysAgo(daysAgo: number): number {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - daysAgo)
  return d.getTime()
}

function startOfWeek(): number {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  // Monday-based week start (getDay(): 0=Sun..6=Sat).
  const diffToMonday = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - diffToMonday)
  return d.getTime()
}

function startOfMonth(): number {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(1)
  return d.getTime()
}

/** Returns the [start, end) millisecond range for a date filter, or null for "All time"/unset custom range. */
function dateRangeFor(
  filter: DateFilterOption,
  customFrom: string,
  customTo: string,
): { start: number; end: number } | null {
  switch (filter) {
    case 'All time':
      return null
    case 'Today':
      return { start: startOfDaysAgo(0), end: startOfDaysAgo(0) + 24 * 60 * 60 * 1000 }
    case 'Yesterday':
      return { start: startOfDaysAgo(1), end: startOfDaysAgo(0) }
    case 'This week':
      return { start: startOfWeek(), end: startOfDaysAgo(0) + 24 * 60 * 60 * 1000 }
    case 'This month':
      return { start: startOfMonth(), end: startOfDaysAgo(0) + 24 * 60 * 60 * 1000 }
    case 'Custom range': {
      if (!customFrom && !customTo) return null
      const start = customFrom ? new Date(`${customFrom}T00:00:00`).getTime() : -Infinity
      const end = customTo ? new Date(`${customTo}T23:59:59.999`).getTime() : Infinity
      return { start, end }
    }
  }
}

const SORT_OPTIONS = [
  'Newest',
  'Oldest',
  'Price: high to low',
  'Price: low to high',
  'Gen time: slow to fast',
  'Gen time: fast to slow',
] as const
type SortOption = (typeof SORT_OPTIONS)[number]

function sortJobs(jobs: GenerationJob[], sort: SortOption): GenerationJob[] {
  const sorted = [...jobs]
  switch (sort) {
    case 'Newest':
      return sorted.sort((a, b) => b.createdAt - a.createdAt)
    case 'Oldest':
      return sorted.sort((a, b) => a.createdAt - b.createdAt)
    case 'Price: high to low':
      return sorted.sort((a, b) => (b.result?.cost ?? -1) - (a.result?.cost ?? -1))
    case 'Price: low to high':
      return sorted.sort((a, b) => (a.result?.cost ?? Infinity) - (b.result?.cost ?? Infinity))
    case 'Gen time: slow to fast':
      return sorted.sort((a, b) => (b.elapsedMs ?? -1) - (a.elapsedMs ?? -1))
    case 'Gen time: fast to slow':
      return sorted.sort((a, b) => (a.elapsedMs ?? Infinity) - (b.elapsedMs ?? Infinity))
  }
}

async function urlToDataUri(url: string): Promise<string> {
  const res = await fetch(url)
  const blob = await res.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

/** Fetches a job's media as bytes, patching in the generation metadata for image (non-video) jobs. */
async function fetchMediaBytes(job: GenerationJob): Promise<Uint8Array> {
  const url = mediaUrlFor(job)!
  const buffer = await fetch(url).then((r) => r.arrayBuffer())
  const bytes = new Uint8Array(buffer)
  if (job.kind === 'videoInference') return bytes
  return embedImageMetadata(bytes, serializeJobMetadata(job))
}

async function downloadJobsAsZip(jobs: GenerationJob[]) {
  const downloadable = jobs.filter((j) => mediaUrlFor(j))
  const files: Record<string, Uint8Array> = {}

  const blobs = await Promise.all(downloadable.map((job) => fetchMediaBytes(job)))

  downloadable.forEach((job, i) => {
    files[`runware-${job.id}.${extensionFor(job.outputFormat)}`] = blobs[i]
  })

  const zipped = zipSync(files)
  const blob = new Blob([zipped], { type: 'application/zip' })
  const objectUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = objectUrl
  a.download = `runware-generations-${downloadable.length}.zip`
  a.click()
  URL.revokeObjectURL(objectUrl)
}

const MODEL_FILTER_ALL = 'All models'
const ASPECT_RATIO_FILTER_ALL = 'All aspect ratios'
const STAR_FILTER_OPTIONS = ['All', 'Starred'] as const
type StarFilterOption = (typeof STAR_FILTER_OPTIONS)[number]

type ViewMode = 'grid' | 'masonry'
const VIEW_MODE_STORAGE_KEY = 'runware-generator:results-view-mode'

function loadViewMode(): ViewMode {
  const stored = localStorage.getItem(VIEW_MODE_STORAGE_KEY)
  return stored === 'masonry' ? 'masonry' : 'grid'
}

const OVERLAYS_VISIBLE_STORAGE_KEY = 'runware-generator:results-overlays-visible'

function loadOverlaysVisible(): boolean {
  return localStorage.getItem(OVERLAYS_VISIBLE_STORAGE_KEY) !== 'false'
}

const CARD_SIZE_STORAGE_KEY = 'runware-generator:results-card-size'
const MIN_CARD_SIZE = 140
const MAX_CARD_SIZE = 360
const CARD_SIZE_STEP = 20
const DEFAULT_CARD_SIZE = 220

function loadCardSize(): number {
  const stored = Number(localStorage.getItem(CARD_SIZE_STORAGE_KEY))
  if (Number.isFinite(stored) && stored >= MIN_CARD_SIZE && stored <= MAX_CARD_SIZE) return stored
  return DEFAULT_CARD_SIZE
}

/** 'folders' shows the folder rail and filters the grid to whichever folder is selected;
 *  'flat' (aka "expand all") ignores folder membership entirely and shows every job, with a
 *  small folder-name badge on cards that are filed. */
type GroupMode = 'folders' | 'flat'
const GROUP_MODE_STORAGE_KEY = 'runware-generator:results-group-mode'

function loadGroupMode(): GroupMode {
  return localStorage.getItem(GROUP_MODE_STORAGE_KEY) === 'flat' ? 'flat' : 'folders'
}

export function ResultsFeed() {
  const jobs = useGenerationStore((s) => s.jobs)
  const selectedJobIds = useGenerationStore((s) => s.selectedJobIds)
  const deleteSelectedJobs = useGenerationStore((s) => s.deleteSelectedJobs)
  const clearSelection = useGenerationStore((s) => s.clearSelection)
  const selectAllJobs = useGenerationStore((s) => s.selectAllJobs)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [isZipping, setIsZipping] = useState(false)
  const [showCompare, setShowCompare] = useState(false)
  const [modelFilter, setModelFilter] = useState(MODEL_FILTER_ALL)
  const [aspectRatioFilter, setAspectRatioFilter] = useState(ASPECT_RATIO_FILTER_ALL)
  const [starFilter, setStarFilter] = useState<StarFilterOption>('All')
  const [viewMode, setViewModeState] = useState<ViewMode>(loadViewMode)
  const setViewMode = (mode: ViewMode) => {
    localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode)
    setViewModeState(mode)
  }
  const [overlaysVisible, setOverlaysVisibleState] = useState<boolean>(loadOverlaysVisible)
  const setOverlaysVisible = (visible: boolean) => {
    localStorage.setItem(OVERLAYS_VISIBLE_STORAGE_KEY, String(visible))
    setOverlaysVisibleState(visible)
  }
  const [groupMode, setGroupModeState] = useState<GroupMode>(loadGroupMode)
  const setGroupMode = (mode: GroupMode) => {
    localStorage.setItem(GROUP_MODE_STORAGE_KEY, mode)
    setGroupModeState(mode)
  }
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null)
  const folders = useFoldersStore((s) => s.folders)
  const jobFolderMap = useFoldersStore((s) => s.jobFolderMap)
  const moveJobToFolder = useFoldersStore((s) => s.moveJobToFolder)
  const moveJobsToFolder = useFoldersStore((s) => s.moveJobsToFolder)
  const [cardSize, setCardSizeState] = useState<number>(loadCardSize)
  const setCardSize = (size: number) => {
    const clamped = Math.min(MAX_CARD_SIZE, Math.max(MIN_CARD_SIZE, size))
    localStorage.setItem(CARD_SIZE_STORAGE_KEY, String(clamped))
    setCardSizeState(clamped)
  }
  const [dateFilter, setDateFilter] = useState<DateFilterOption>('All time')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [sort, setSort] = useState<SortOption>('Newest')
  const [filtersOpen, setFiltersOpen] = useState(false)

  const modelOptions = useMemo(() => {
    const ids = [...new Set(jobs.map((j) => j.modelId))]
    return [MODEL_FILTER_ALL, ...ids.map((id) => findModel(id).label)]
  }, [jobs])

  const aspectRatioOptions = useMemo(() => {
    const labels = [...new Set(jobs.map(aspectRatioLabelFor).filter((l): l is string => Boolean(l)))]
    return [ASPECT_RATIO_FILTER_ALL, ...labels]
  }, [jobs])

  const dateRange = useMemo(
    () => dateRangeFor(dateFilter, customFrom, customTo),
    [dateFilter, customFrom, customTo],
  )

  const filteredJobs = useMemo(() => {
    const filtered = jobs.filter((j) => {
      if (modelFilter !== MODEL_FILTER_ALL && findModel(j.modelId).label !== modelFilter) return false
      if (aspectRatioFilter !== ASPECT_RATIO_FILTER_ALL && aspectRatioLabelFor(j) !== aspectRatioFilter)
        return false
      if (dateRange && (j.createdAt < dateRange.start || j.createdAt >= dateRange.end)) return false
      if (starFilter === 'Starred' && !j.starred) return false
      if (groupMode === 'folders' && activeFolderId) {
        const filedFolderId = jobFolderMap[j.id] ?? null
        if (activeFolderId === UNFILED_FOLDER_ID) {
          if (filedFolderId) return false
        } else if (filedFolderId !== activeFolderId) {
          return false
        }
      }
      return true
    })
    return sortJobs(filtered, sort)
  }, [jobs, modelFilter, aspectRatioFilter, dateRange, starFilter, sort, groupMode, activeFolderId, jobFolderMap])

  const viewableJobs = filteredJobs.filter((j) => j.status === 'success' && mediaUrlFor(j))

  const activeFilterCount = [
    modelFilter !== MODEL_FILTER_ALL,
    aspectRatioFilter !== ASPECT_RATIO_FILTER_ALL,
    dateFilter !== 'All time',
    starFilter !== 'All',
  ].filter(Boolean).length

  if (jobs.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-neutral-40">
        <p className="text-sm">Your generated images will show up here.</p>
      </div>
    )
  }

  const activeJob = lightboxIndex !== null ? viewableJobs[lightboxIndex] : undefined

  const selectedImageJobs = jobs.filter(
    (j) => selectedJobIds.has(j.id) && j.kind !== 'videoInference' && mediaUrlFor(j),
  )
  const canCompare = selectedJobIds.size === 2 && selectedImageJobs.length === 2

  return (
    <div className="flex h-full flex-col">
      <p className="border-b border-neutral-70 bg-card px-4 py-1.5 text-center text-xs text-neutral-40">
        Generations aren't stored long-term on Runware's servers — download or save anything you want to keep.
      </p>
      <div className="border-b border-neutral-70 bg-card">
        <button
          onClick={() => setFiltersOpen((v) => !v)}
          className="flex w-full items-center gap-2 px-4 py-2 text-sm text-neutral-20 md:hidden"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filters & sort
          {activeFilterCount > 0 && (
            <span className="rounded-full bg-brand-green/15 px-1.5 py-0.5 text-xs font-medium text-brand-green-text">
              {activeFilterCount}
            </span>
          )}
          <span className="ml-auto font-mono text-xs text-neutral-50">
            {filteredJobs.length}/{jobs.length}
          </span>
          <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
        </button>

        <div
          className={`flex-wrap items-end gap-2 px-4 py-2 md:flex ${filtersOpen ? 'flex' : 'hidden'}`}
        >
          <div className="w-44">
            <Select label="Model" value={modelFilter} options={modelOptions} onChange={setModelFilter} />
          </div>
          <div className="w-36">
            <Select
              label="Aspect ratio"
              value={aspectRatioFilter}
              options={aspectRatioOptions}
              onChange={setAspectRatioFilter}
            />
          </div>
          <div className="w-36">
            <Select label="Generated at" value={dateFilter} options={DATE_FILTER_OPTIONS} onChange={setDateFilter} />
          </div>
          <div className="w-28">
            <Select label="Starred" value={starFilter} options={STAR_FILTER_OPTIONS} onChange={setStarFilter} />
          </div>
          {dateFilter === 'Custom range' && (
            <>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-neutral-20">From</label>
                <input
                  type="date"
                  value={customFrom}
                  max={customTo || undefined}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="rounded-md border border-neutral-70 bg-input px-2.5 py-1.5 text-sm text-neutral-5 outline-none focus:border-brand-green-text"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-neutral-20">To</label>
                <input
                  type="date"
                  value={customTo}
                  min={customFrom || undefined}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="rounded-md border border-neutral-70 bg-input px-2.5 py-1.5 text-sm text-neutral-5 outline-none focus:border-brand-green-text"
                />
              </div>
            </>
          )}
          <div className="w-44">
            <Select label="Sort by" value={sort} options={SORT_OPTIONS} onChange={setSort} />
          </div>
          {activeFilterCount > 0 && (
            <button
              onClick={() => {
                setModelFilter(MODEL_FILTER_ALL)
                setAspectRatioFilter(ASPECT_RATIO_FILTER_ALL)
                setDateFilter('All time')
                setCustomFrom('')
                setCustomTo('')
                setStarFilter('All')
              }}
              className="rounded-md px-2.5 py-1.5 text-xs font-medium text-neutral-40 hover:text-neutral-20"
            >
              Clear filters
            </button>
          )}
          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center rounded-md border border-neutral-70 bg-input p-0.5">
              <button
                type="button"
                onClick={() => setGroupMode('folders')}
                title="Folder view"
                aria-label="Folder view"
                className={`flex h-7 w-7 items-center justify-center rounded ${
                  groupMode === 'folders' ? 'bg-neutral-70 text-neutral-5' : 'text-neutral-40 hover:text-neutral-20'
                }`}
              >
                <FolderIcon className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setGroupMode('flat')
                  setActiveFolderId(null)
                }}
                title="Expand all (ignore folders)"
                aria-label="Expand all (ignore folders)"
                className={`px-2 text-[11px] font-medium ${
                  groupMode === 'flat' ? 'text-brand-green-text' : 'text-neutral-40 hover:text-neutral-20'
                }`}
              >
                Expand all
              </button>
            </div>
            <button
              type="button"
              onClick={() => setOverlaysVisible(!overlaysVisible)}
              title={overlaysVisible ? 'Hide image overlay buttons' : 'Show image overlay buttons'}
              aria-label={overlaysVisible ? 'Hide image overlay buttons' : 'Show image overlay buttons'}
              className={`flex h-7 w-7 items-center justify-center rounded-md border transition-colors ${
                overlaysVisible
                  ? 'border-brand-green-text bg-brand-green/10 text-brand-green-text'
                  : 'border-brand-yellow/50 bg-brand-yellow/10 text-brand-yellow-text'
              }`}
            >
              <EyeOff className="h-3.5 w-3.5" />
            </button>
            <div className="flex items-center rounded-md border border-neutral-70 bg-input p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                title="Grid view (cropped 1:1)"
                aria-label="Grid view"
                className={`flex h-7 w-7 items-center justify-center rounded ${
                  viewMode === 'grid' ? 'bg-neutral-70 text-neutral-5' : 'text-neutral-40 hover:text-neutral-20'
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('masonry')}
                title="Masonry view (native aspect ratio)"
                aria-label="Masonry view"
                className={`flex h-7 w-7 items-center justify-center rounded ${
                  viewMode === 'masonry' ? 'bg-neutral-70 text-neutral-5' : 'text-neutral-40 hover:text-neutral-20'
                }`}
              >
                <Rows3 className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex items-center rounded-md border border-neutral-70 bg-input p-0.5">
              <button
                type="button"
                onClick={() => setCardSize(cardSize - CARD_SIZE_STEP)}
                disabled={cardSize <= MIN_CARD_SIZE}
                title="Smaller thumbnails"
                aria-label="Smaller thumbnails"
                className="flex h-7 w-7 items-center justify-center rounded text-neutral-40 hover:text-neutral-20 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setCardSize(cardSize + CARD_SIZE_STEP)}
                disabled={cardSize >= MAX_CARD_SIZE}
                title="Larger thumbnails"
                aria-label="Larger thumbnails"
                className="flex h-7 w-7 items-center justify-center rounded text-neutral-40 hover:text-neutral-20 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
            </div>
            <span className="hidden self-center font-mono text-xs text-neutral-50 md:inline">
              {filteredJobs.length}/{jobs.length}
            </span>
          </div>
        </div>
      </div>
      {groupMode === 'folders' && (
        <FolderRail
          jobs={jobs}
          jobFolderMap={jobFolderMap}
          activeFolderId={activeFolderId}
          onSelectFolder={setActiveFolderId}
          onDropJob={(jobId, folderId) => moveJobToFolder(jobId, folderId)}
        />
      )}
      {selectedJobIds.size > 0 && (
        <div className="flex items-center justify-between border-b border-neutral-70 bg-card px-4 py-2">
          <span className="text-sm text-neutral-20">{selectedJobIds.size} selected</span>
          <div className="flex gap-2">
            <button
              onClick={clearSelection}
              className="rounded-md px-3 py-1 text-sm text-neutral-40 hover:text-neutral-20"
            >
              Cancel
            </button>
            <button
              onClick={selectAllJobs}
              className="rounded-md px-3 py-1 text-sm text-neutral-20 hover:text-neutral-5"
            >
              Select all
            </button>
            {folders.length > 0 && (
              <select
                value=""
                onChange={(e) => {
                  if (!e.target.value) return
                  moveJobsToFolder([...selectedJobIds], e.target.value === UNFILED_FOLDER_ID ? null : e.target.value)
                  clearSelection()
                }}
                className="rounded-md border border-neutral-70 bg-input px-2.5 py-1 text-sm text-neutral-20 outline-none focus:border-brand-green-text"
              >
                <option value="" disabled>
                  Move to folder…
                </option>
                <option value={UNFILED_FOLDER_ID}>Unfiled</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            )}
            {canCompare && (
              <button
                onClick={() => setShowCompare(true)}
                className="flex items-center gap-1.5 rounded-md bg-brand-green px-3 py-1 text-sm font-medium text-on-brand hover:bg-brand-green-mid"
              >
                <Columns2 className="h-3.5 w-3.5" />
                Compare
              </button>
            )}
            <button
              disabled={isZipping}
              onClick={async () => {
                setIsZipping(true)
                try {
                  await downloadJobsAsZip(jobs.filter((j) => selectedJobIds.has(j.id)))
                } finally {
                  setIsZipping(false)
                }
              }}
              className="rounded-md bg-neutral-80 px-3 py-1 text-sm font-medium text-neutral-5 hover:bg-neutral-70 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isZipping ? 'Zipping…' : 'Download'}
            </button>
            <button
              onClick={() => {
                if (confirm(`Delete ${selectedJobIds.size} generation(s)?`)) deleteSelectedJobs()
              }}
              className="rounded-md bg-brand-destructive/10 px-3 py-1 text-sm font-medium text-brand-destructive hover:bg-brand-destructive/20"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {filteredJobs.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-sm text-neutral-40">
          No generations match the current filters.
        </div>
      ) : viewMode === 'masonry' ? (
        <div
          className="min-w-0 overflow-y-auto p-4 [column-gap:1rem]"
          style={{ columns: `${cardSize}px` }}
        >
          {filteredJobs.map((job) => (
            <div key={job.id} className="mb-4 break-inside-avoid">
              <JobCard
                job={job}
                selectMode={selectedJobIds.size > 0}
                viewMode={viewMode}
                overlaysVisible={overlaysVisible}
                cardSize={cardSize}
                folderName={groupMode === 'flat' ? folders.find((f) => f.id === jobFolderMap[job.id])?.name : undefined}
                onEnlarge={() => setLightboxIndex(viewableJobs.findIndex((j) => j.id === job.id))}
              />
            </div>
          ))}
        </div>
      ) : (
        <div
          className="grid gap-4 overflow-y-auto p-4"
          style={{ gridTemplateColumns: `repeat(auto-fill, ${cardSize}px)` }}
        >
          {filteredJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              selectMode={selectedJobIds.size > 0}
              viewMode={viewMode}
              overlaysVisible={overlaysVisible}
              cardSize={cardSize}
              folderName={groupMode === 'flat' ? folders.find((f) => f.id === jobFolderMap[job.id])?.name : undefined}
              onEnlarge={() => setLightboxIndex(viewableJobs.findIndex((j) => j.id === job.id))}
            />
          ))}
        </div>
      )}

      {activeJob && (
        <Lightbox
          job={activeJob}
          onClose={() => setLightboxIndex(null)}
          onPrev={
            lightboxIndex !== null && lightboxIndex > 0
              ? () => setLightboxIndex((i) => (i ?? 0) - 1)
              : undefined
          }
          onNext={
            lightboxIndex !== null && lightboxIndex < viewableJobs.length - 1
              ? () => setLightboxIndex((i) => (i ?? 0) + 1)
              : undefined
          }
        />
      )}

      {showCompare && canCompare && (
        <CompareModal
          left={{
            url: mediaUrlFor(selectedImageJobs[0])!,
            label: findModel(selectedImageJobs[0].modelId).label,
          }}
          right={{
            url: mediaUrlFor(selectedImageJobs[1])!,
            label: findModel(selectedImageJobs[1].modelId).label,
          }}
          onClose={() => setShowCompare(false)}
        />
      )}
    </div>
  )
}

function JobCard({
  job,
  selectMode,
  viewMode,
  overlaysVisible,
  cardSize,
  folderName,
  onEnlarge,
}: {
  job: GenerationJob
  selectMode: boolean
  viewMode: ViewMode
  overlaysVisible: boolean
  cardSize: number
  /** Shown as a small badge on the card — only passed in "Expand all" (flat) view, since the
   *  folder rail view already groups by folder and the badge would be redundant there. */
  folderName?: string
  onEnlarge: () => void
}) {
  const toggleJobSelected = useGenerationStore((s) => s.toggleJobSelected)
  const selectedJobIds = useGenerationStore((s) => s.selectedJobIds)
  const remixJob = useGenerationStore((s) => s.remixJob)
  const deleteJob = useGenerationStore((s) => s.deleteJob)
  const toggleJobStarred = useGenerationStore((s) => s.toggleJobStarred)
  const activeModelId = useGenerationStore((s) => s.modelId)
  const setModelId = useGenerationStore((s) => s.setModelId)
  const setUpscaleInputImage = useUpscaleStore((s) => s.setInputImage)
  const setRembgInputImage = useRembgStore((s) => s.setInputImage)
  const setPendingUpload = useMyMediaStore((s) => s.setPendingUpload)
  const uploadNewMedia = useMyMediaStore((s) => s.uploadNew)
  const apiKey = useApiKeyStore((s) => s.apiKey)
  const isSelected = selectedJobIds.has(job.id)
  const canSelect = job.status !== 'pending'
  const mediaUrl = mediaUrlFor(job)
  const isVideo = job.kind === 'videoInference'
  // Grid/masonry cards only ever show a small box — decoding the full-res original (esp. 4K
  // Seedream results) per card gets sluggish fast with many jobs mounted at once. Use a
  // downscaled thumbnail there instead; the Lightbox still opens the real mediaUrl.
  const thumbnailUrl = useThumbnail(!isVideo ? mediaUrl : undefined)
  const gridImageUrl = thumbnailUrl ?? mediaUrl
  const [minimaxTarget, setMinimaxTarget] = useState<string | null>(null)
  const [showApiRequest, setShowApiRequest] = useState(false)
  const [showEditImage, setShowEditImage] = useState(false)
  const [promptStudioDraft, setPromptStudioDraft] = useState<PromptEntryInitialDraft | null>(null)
  const [isSavingToPromptStudio, setIsSavingToPromptStudio] = useState(false)
  const dims = dimensionsFor(job)
  const aspectRatio = viewMode === 'masonry' && dims ? dims.width / dims.height : undefined

  function handleEditedDownload(dataUri: string) {
    const a = document.createElement('a')
    a.href = dataUri
    a.download = `runware-${job.id}-edited.png`
    a.click()
  }

  function handleEditedSaveAsCopy(dataUri: string) {
    setPendingUpload({ name: `runware-${job.id}-edited.png`, dataUri })
    setModelId(MANAGE_MEDIA_MODEL.id)
    setShowEditImage(false)
  }

  function handleEditedUseAsInput(dataUri: string) {
    if (isMinimaxH3Model(activeModelId)) {
      setMinimaxTarget(dataUri)
    } else {
      setInputImageForModel(activeModelId, dataUri)
    }
    setShowEditImage(false)
  }

  function handleEditedSendToUpscale(dataUri: string) {
    setUpscaleInputImage(dataUri)
    setModelId(UPSCALE_MODEL.id)
    setShowEditImage(false)
  }

  function handleEditedSendToRemoveBackground(dataUri: string) {
    setRembgInputImage(dataUri)
    setModelId(REMBG_MODEL.id)
    setShowEditImage(false)
  }

  async function handleUseAsInput() {
    if (!mediaUrl) return
    const dataUri = await urlToDataUri(mediaUrl)
    if (isMinimaxH3Model(activeModelId)) {
      setMinimaxTarget(dataUri)
    } else {
      setInputImageForModel(activeModelId, dataUri)
    }
  }

  async function handleUpscale() {
    if (!mediaUrl) return
    const dataUri = await urlToDataUri(mediaUrl)
    setUpscaleInputImage(dataUri)
    setModelId(UPSCALE_MODEL.id)
  }

  async function handleRemoveBackground() {
    if (!mediaUrl) return
    const dataUri = await urlToDataUri(mediaUrl)
    setRembgInputImage(dataUri)
    setModelId(REMBG_MODEL.id)
  }

  async function handleAddToMyMedia() {
    if (!mediaUrl) return
    const dataUri = await urlToDataUri(mediaUrl)
    setPendingUpload({ name: `runware-${job.id}.${extensionFor(job.outputFormat)}`, dataUri })
    setModelId(MANAGE_MEDIA_MODEL.id)
  }

  async function handleAddToPromptStudio() {
    if (!mediaUrl || !apiKey || !isImageGenJob(job)) return
    setIsSavingToPromptStudio(true)
    try {
      const dataUri = await urlToDataUri(mediaUrl)
      const mediaUUID = await uploadNewMedia(apiKey, `runware-${job.id}.${extensionFor(job.outputFormat)}`, dataUri)
      const model = findModel(job.modelId)
      setPromptStudioDraft({
        title: job.positivePrompt.slice(0, 40),
        positiveText: job.positivePrompt,
        negativeText: 'negativePrompt' in job ? job.negativePrompt : '',
        ecosystem: model.ecosystem ?? null,
        modelId: job.modelId,
        lora: 'lora' in job ? job.lora : [],
        exampleMediaUUIDs: mediaUUID ? [mediaUUID] : [],
      })
    } finally {
      setIsSavingToPromptStudio(false)
    }
  }

  async function handleCopyPrompt() {
    if (!isImageGenJob(job)) return
    try {
      await navigator.clipboard.writeText(job.positivePrompt)
    } catch {
      // Clipboard access denied or unavailable — nothing more we can do.
    }
  }

  return (
    <div
      draggable={canSelect}
      onDragStart={(e) => {
        e.dataTransfer.setData('text/runware-job-id', job.id)
        e.dataTransfer.effectAllowed = 'move'
      }}
      className={`w-full rounded-md border bg-card transition-colors ${
        isSelected ? 'border-brand-green-text' : 'border-neutral-70'
      }`}
    >
      <div
        className="relative flex w-full items-center justify-center overflow-hidden rounded-t-md bg-bg"
        style={aspectRatio ? { aspectRatio } : { height: cardSize }}
      >
        {canSelect && overlaysVisible && (
          <label className="absolute left-2 top-2 z-10 flex h-5 w-5 cursor-pointer items-center justify-center rounded border border-neutral-50 bg-neutral-100/80 backdrop-blur">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => toggleJobSelected(job.id)}
              className="h-3.5 w-3.5 accent-brand-green"
            />
          </label>
        )}
        {folderName && (
          <span
            className={`absolute top-2 z-10 max-w-[calc(50%)] truncate rounded bg-neutral-100/70 px-1.5 py-0.5 text-[10px] font-medium text-neutral-5 backdrop-blur ${
              canSelect && overlaysVisible ? 'left-9' : 'left-2'
            }`}
          >
            {folderName}
          </span>
        )}

        {job.status === 'pending' && (
          <div className="flex flex-col items-center gap-2 text-neutral-40">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-70 border-t-brand-green" />
            <span className="text-xs">
              {isVideo && job.progress !== undefined ? `Generating… ${job.progress}%` : 'Generating…'}
            </span>
          </div>
        )}
        {job.status === 'error' && (
          <>
            <p className="px-4 text-center text-xs text-brand-destructive">{job.errorMessage}</p>
            <button
              onClick={() => setShowApiRequest(true)}
              title="View API request"
              aria-label="View API request"
              className="absolute bottom-2 left-2 z-10 flex h-7 w-7 items-center justify-center rounded-md border border-neutral-50 bg-neutral-100/80 text-neutral-5 backdrop-blur hover:bg-neutral-100/95"
            >
              <Code className="h-4 w-4" strokeWidth={1.75} />
            </button>
          </>
        )}
        {job.status === 'success' && mediaUrl && (
          <>
            {overlaysVisible && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  toggleJobStarred(job.id)
                }}
                title={job.starred ? 'Unstar' : 'Star'}
                aria-label={job.starred ? 'Unstar' : 'Star'}
                className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-md bg-neutral-100/60 text-neutral-5 backdrop-blur transition-colors hover:bg-neutral-100/90"
              >
                <Star
                  className={`h-4 w-4 ${job.starred ? 'fill-brand-yellow text-brand-yellow' : ''}`}
                  strokeWidth={1.75}
                />
              </button>
            )}
            <button
              onClick={() => (selectMode ? toggleJobSelected(job.id) : onEnlarge())}
              className={`h-full w-full ${selectMode ? 'cursor-pointer' : 'cursor-zoom-in'}`}
              title={selectMode ? 'Click to select' : 'Click to enlarge'}
            >
              {isVideo ? (
                <video src={mediaUrl} muted loop autoPlay playsInline className="h-full w-full object-cover" />
              ) : (
                <img
                  src={gridImageUrl}
                  alt={
                    isImageGenJob(job)
                      ? job.positivePrompt
                      : job.kind === 'removeBackground'
                        ? 'Background removed'
                        : 'Upscaled image'
                  }
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
              )}
            </button>
            {!selectMode && overlaysVisible && (
              <ImageActionsMenu
                items={[
                  ...(isImageGenJob(job)
                    ? [
                        {
                          label: 'Remix',
                          icon: <Repeat2 className="h-4 w-4" strokeWidth={1.75} />,
                          onSelect: () => remixJob(job),
                        },
                        {
                          label: 'Remix (with seed)',
                          icon: <Repeat2 className="h-4 w-4" strokeWidth={1.75} />,
                          onSelect: () => remixJob(job, { includeSeed: true }),
                        },
                        {
                          label: 'Copy prompt',
                          icon: <Copy className="h-4 w-4" strokeWidth={1.75} />,
                          onSelect: () => void handleCopyPrompt(),
                        },
                      ]
                    : []),
                  ...(!isVideo
                    ? [
                        {
                          label: 'Edit image',
                          icon: <Pencil className="h-4 w-4" strokeWidth={1.75} />,
                          onSelect: () => setShowEditImage(true),
                        },
                        {
                          label: 'Upscale',
                          icon: <ArrowUpToLine className="h-4 w-4" strokeWidth={1.75} />,
                          onSelect: () => void handleUpscale(),
                        },
                        {
                          label: 'Remove background',
                          icon: <Eraser className="h-4 w-4" strokeWidth={1.75} />,
                          onSelect: () => void handleRemoveBackground(),
                        },
                      ]
                    : []),
                  {
                    label: 'Add to My Media',
                    icon: <FolderPlus className="h-4 w-4" strokeWidth={1.75} />,
                    onSelect: () => void handleAddToMyMedia(),
                  },
                  ...(isImageGenJob(job)
                    ? [
                        {
                          label: isSavingToPromptStudio ? 'Uploading…' : 'Add to Prompt Studio',
                          icon: <BookText className="h-4 w-4" strokeWidth={1.75} />,
                          onSelect: () => void handleAddToPromptStudio(),
                        },
                      ]
                    : []),
                  {
                    label: 'Open in new tab',
                    icon: <ExternalLink className="h-4 w-4" strokeWidth={1.75} />,
                    onSelect: () => window.open(mediaUrl, '_blank', 'noopener,noreferrer'),
                  },
                  {
                    label: 'View API request',
                    icon: <Code className="h-4 w-4" strokeWidth={1.75} />,
                    onSelect: () => setShowApiRequest(true),
                  },
                  {
                    label: 'Delete',
                    icon: <Trash2 className="h-4 w-4" strokeWidth={1.75} />,
                    destructive: true,
                    onSelect: () => {
                      if (confirm('Delete this generation?')) deleteJob(job.id)
                    },
                  },
                  ...(!isVideo
                    ? [
                        {
                          label: 'Use as input image',
                          icon: <ImageDown className="h-4 w-4" strokeWidth={1.75} />,
                          onSelect: () => void handleUseAsInput(),
                        },
                      ]
                    : []),
                ]}
              />
            )}
            {overlaysVisible && <SaveButton job={job} />}
          </>
        )}
      </div>
      <div className="flex items-center gap-2 p-3">
        <p className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 font-mono text-xs text-neutral-50">
          <span className="shrink-0">
            {isImageGenJob(job)
              ? `${job.width}×${job.height}`
              : job.kind === 'videoInference'
                ? `${job.width}×${job.height} · ${job.duration}s`
                : job.kind === 'removeBackground'
                  ? 'PNG'
                  : job.upscaleFactor
                    ? `${job.upscaleFactor}×`
                    : `${job.targetMegapixels}MP`}
          </span>
          {job.status === 'success' && job.result?.cost !== undefined && (
            <span className="text-brand-green-text">${job.result.cost.toFixed(4)}</span>
          )}
          {job.status === 'success' && job.elapsedMs !== undefined && (
            <span className="shrink-0" title="Client-measured time from request to response">
              {(job.elapsedMs / 1000).toFixed(1)}s
            </span>
          )}
        </p>
      </div>

      {minimaxTarget && (
        <UseAsInputModal
          image={minimaxTarget}
          onClose={() => setMinimaxTarget(null)}
          onSelect={(target) => {
            setMinimaxH3Input(minimaxTarget, target)
            setMinimaxTarget(null)
          }}
        />
      )}

      {showApiRequest && (
        <ApiRequestModal
          request={job.apiRequest}
          response={job.apiResponse}
          errorMessage={job.status === 'error' ? job.errorMessage : undefined}
          onClose={() => setShowApiRequest(false)}
        />
      )}

      {showEditImage && mediaUrl && (
        <EditImageModal
          image={mediaUrl}
          suggestedName={`runware-${job.id}-edited.png`}
          onClose={() => setShowEditImage(false)}
          onDownload={handleEditedDownload}
          onSaveAsCopy={handleEditedSaveAsCopy}
          onUseAsInput={handleEditedUseAsInput}
          onSendToUpscale={handleEditedSendToUpscale}
          onSendToRemoveBackground={handleEditedSendToRemoveBackground}
        />
      )}

      {promptStudioDraft && (
        <PromptEntryEditorModal
          entry={null}
          initialDraft={promptStudioDraft}
          onClose={() => setPromptStudioDraft(null)}
        />
      )}
    </div>
  )
}

function SaveButton({ job }: { job: GenerationJob }) {
  async function handleSave() {
    const url = mediaUrlFor(job)
    if (!url) return
    try {
      const bytes = await fetchMediaBytes(job)
      const blob = new Blob([bytes.slice()])
      const objectUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = objectUrl
      a.download = `runware-${job.id}.${extensionFor(job.outputFormat)}`
      a.click()
      URL.revokeObjectURL(objectUrl)
    } catch {
      // Fall back to opening the image directly if the fetch/blob download is blocked (e.g. CORS).
      window.open(url, '_blank')
    }
  }

  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        void handleSave()
      }}
      title="Save image"
      aria-label="Save image"
      className="absolute bottom-2 right-2 z-10 flex h-7 w-7 items-center justify-center rounded-md bg-neutral-100/60 text-neutral-5 backdrop-blur transition-colors hover:bg-neutral-100/90"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0-4-4m4 4 4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
      </svg>
    </button>
  )
}
