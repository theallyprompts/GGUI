import { create } from 'zustand'
import type { RunwareLora } from '../lib/runware/types'
import type { Ecosystem } from '../lib/models'

const STORAGE_KEY = 'runware-generator:prompt-studio'

export type PromptEntryKind = 'full' | 'fragment'

export interface PromptStudioEntry {
  id: string
  createdAt: number
  updatedAt: number
  title: string
  positiveText: string
  negativeText: string
  /** 'full' = a complete, ready-to-use prompt. 'fragment' = a reusable piece (a style clause,
   *  a quality-tag block, a character description) meant to be inserted into an existing prompt
   *  rather than replace it. */
  kind: PromptEntryKind
  ecosystem: Ecosystem | null
  /** Pins to one specific model in the registry — tighter than ecosystem, optional. */
  modelId: string | null
  lora: RunwareLora[]
  tags: string[]
  /** My Media UUIDs (not raw Runware CDN URLs, which expire) for attached example results. */
  exampleMediaUUIDs: string[]
  usageCount: number
  lastUsedAt: number | null
}

export type PromptEntryDraft = Pick<
  PromptStudioEntry,
  'title' | 'positiveText' | 'negativeText' | 'kind' | 'ecosystem' | 'modelId' | 'lora' | 'tags'
>

interface PromptStudioExport {
  app: 'runware-generator'
  version: 1
  entries: PromptStudioEntry[]
}

function loadPersisted(): PromptStudioEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? (parsed as PromptStudioEntry[]) : []
  } catch {
    return []
  }
}

function persist(entries: PromptStudioEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  } catch {
    // localStorage full or unavailable — persistence is best-effort.
  }
}

function makeId(): string {
  return crypto.randomUUID()
}

interface PromptStudioState {
  entries: PromptStudioEntry[]
  /** Set by anything that wants Prompt Studio to open a specific entry for editing as soon as
   *  it's next shown (e.g. the "Edit" button in the Load-from-Prompt-Studio picker, opened from
   *  a model form rather than from within Prompt Studio itself). PromptStudioView consumes and
   *  clears this on render. */
  pendingEditEntryId: string | null

  addEntry: (draft: PromptEntryDraft) => PromptStudioEntry
  updateEntry: (id: string, patch: Partial<PromptEntryDraft>) => void
  deleteEntry: (id: string) => void
  markUsed: (id: string) => void
  attachExampleMedia: (id: string, mediaUUID: string) => void
  removeExampleMedia: (id: string, mediaUUID: string) => void
  requestEdit: (id: string) => void
  clearPendingEdit: () => void

  exportLibrary: () => string
  importLibrary: (json: string) => { imported: number; skipped: number } | null
}

export const usePromptStudioStore = create<PromptStudioState>((set, get) => ({
  entries: loadPersisted(),
  pendingEditEntryId: null,

  requestEdit: (id) => set({ pendingEditEntryId: id }),
  clearPendingEdit: () => set({ pendingEditEntryId: null }),

  addEntry: (draft) => {
    const now = Date.now()
    const entry: PromptStudioEntry = {
      id: makeId(),
      createdAt: now,
      updatedAt: now,
      exampleMediaUUIDs: [],
      usageCount: 0,
      lastUsedAt: null,
      ...draft,
    }
    const entries = [entry, ...get().entries]
    set({ entries })
    persist(entries)
    return entry
  },

  updateEntry: (id, patch) => {
    const entries = get().entries.map((e) => (e.id === id ? { ...e, ...patch, updatedAt: Date.now() } : e))
    set({ entries })
    persist(entries)
  },

  deleteEntry: (id) => {
    const entries = get().entries.filter((e) => e.id !== id)
    set({ entries })
    persist(entries)
  },

  markUsed: (id) => {
    const entries = get().entries.map((e) =>
      e.id === id ? { ...e, usageCount: e.usageCount + 1, lastUsedAt: Date.now() } : e,
    )
    set({ entries })
    persist(entries)
  },

  attachExampleMedia: (id, mediaUUID) => {
    const entries = get().entries.map((e) =>
      e.id === id && !e.exampleMediaUUIDs.includes(mediaUUID)
        ? { ...e, exampleMediaUUIDs: [...e.exampleMediaUUIDs, mediaUUID], updatedAt: Date.now() }
        : e,
    )
    set({ entries })
    persist(entries)
  },

  removeExampleMedia: (id, mediaUUID) => {
    const entries = get().entries.map((e) =>
      e.id === id
        ? { ...e, exampleMediaUUIDs: e.exampleMediaUUIDs.filter((u) => u !== mediaUUID), updatedAt: Date.now() }
        : e,
    )
    set({ entries })
    persist(entries)
  },

  exportLibrary: () => {
    const payload: PromptStudioExport = { app: 'runware-generator', version: 1, entries: get().entries }
    return JSON.stringify(payload, null, 2)
  },

  importLibrary: (json) => {
    try {
      const parsed = JSON.parse(json) as Partial<PromptStudioExport>
      if (parsed.app !== 'runware-generator' || !Array.isArray(parsed.entries)) return null

      const existing = get().entries
      const existingIds = new Set(existing.map((e) => e.id))
      let imported = 0
      let skipped = 0
      const toAdd: PromptStudioEntry[] = []

      for (const entry of parsed.entries) {
        if (
          typeof entry.id !== 'string' ||
          typeof entry.positiveText !== 'string' ||
          typeof entry.createdAt !== 'number'
        ) {
          skipped++
          continue
        }
        if (existingIds.has(entry.id)) {
          skipped++
          continue
        }
        toAdd.push(entry as PromptStudioEntry)
        existingIds.add(entry.id)
        imported++
      }

      const entries = [...toAdd, ...existing]
      set({ entries })
      persist(entries)
      return { imported, skipped }
    } catch {
      return null
    }
  },
}))
