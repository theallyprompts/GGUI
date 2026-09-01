import { create } from 'zustand'
import { uploadMedia, deleteMedia, RunwareApiError } from '../lib/runware/client'

const STORAGE_KEY = 'runware-generator:my-media'

export interface MyMediaItem {
  mediaUUID: string
  mediaURL: string
  name: string
  addedAt: number
}

interface MyMediaExport {
  app: 'runware-generator'
  version: 1
  items: MyMediaItem[]
}

function loadPersisted(): MyMediaItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? (parsed as MyMediaItem[]) : []
  } catch {
    return []
  }
}

function persist(items: MyMediaItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // localStorage full or unavailable — persistence is best-effort.
  }
}

export interface PendingUpload {
  name: string
  dataUri: string
}

interface MyMediaState {
  items: MyMediaItem[]
  isUploading: boolean
  error: string | null
  /** A staged image/video waiting for the user to confirm before it's actually sent to Runware —
   *  populated either by picking a file in Manage Media, or by "Add to My Media" from the wand menu. */
  pendingUpload: PendingUpload | null

  setPendingUpload: (pending: PendingUpload | null) => void
  uploadPending: (apiKey: string) => Promise<void>
  /** Uploads and adds an item directly, bypassing the staged pendingUpload flow — used by
   *  actions that upload as an implementation detail of doing something else (e.g. "Add to
   *  Prompt Studio" attaching an example image), rather than the user explicitly visiting
   *  Manage Media to upload. Returns the new item's mediaUUID, or null if the upload failed. */
  uploadNew: (apiKey: string, name: string, dataUri: string) => Promise<string | null>
  removeMedia: (apiKey: string, mediaUUID: string) => Promise<void>
  renameMedia: (mediaUUID: string, name: string) => void
  exportLibrary: () => string
  importLibrary: (json: string) => { imported: number; skipped: number } | null
  clearError: () => void
}

export const useMyMediaStore = create<MyMediaState>((set, get) => ({
  items: loadPersisted(),
  isUploading: false,
  error: null,
  pendingUpload: null,

  setPendingUpload: (pending) => set({ pendingUpload: pending, error: null }),

  uploadPending: async (apiKey) => {
    const pending = get().pendingUpload
    if (!pending) return
    set({ isUploading: true, error: null })
    const mediaUUID = await get().uploadNew(apiKey, pending.name, pending.dataUri)
    if (mediaUUID) set({ pendingUpload: null })
  },

  uploadNew: async (apiKey, name, dataUri) => {
    set({ isUploading: true, error: null })
    try {
      const result = await uploadMedia(apiKey, dataUri)
      const item: MyMediaItem = {
        mediaUUID: result.mediaUUID,
        mediaURL: result.mediaURL,
        name,
        addedAt: Date.now(),
      }
      const items = [item, ...get().items]
      set({ items, isUploading: false })
      persist(items)
      return item.mediaUUID
    } catch (err) {
      set({
        error: err instanceof RunwareApiError ? err.message : 'Failed to upload media.',
        isUploading: false,
      })
      return null
    }
  },

  removeMedia: async (apiKey, mediaUUID) => {
    set({ error: null })
    try {
      await deleteMedia(apiKey, mediaUUID)
      const items = get().items.filter((i) => i.mediaUUID !== mediaUUID)
      set({ items })
      persist(items)
    } catch (err) {
      set({ error: err instanceof RunwareApiError ? err.message : 'Failed to delete media.' })
    }
  },

  renameMedia: (mediaUUID, name) => {
    const trimmed = name.trim()
    if (!trimmed) return
    const items = get().items.map((i) => (i.mediaUUID === mediaUUID ? { ...i, name: trimmed } : i))
    set({ items })
    persist(items)
  },

  exportLibrary: () => {
    const payload: MyMediaExport = { app: 'runware-generator', version: 1, items: get().items }
    return JSON.stringify(payload, null, 2)
  },

  importLibrary: (json) => {
    try {
      const parsed = JSON.parse(json) as Partial<MyMediaExport>
      if (parsed.app !== 'runware-generator' || !Array.isArray(parsed.items)) return null

      const existing = get().items
      const existingUUIDs = new Set(existing.map((i) => i.mediaUUID))
      let imported = 0
      let skipped = 0
      const toAdd: MyMediaItem[] = []

      for (const item of parsed.items) {
        if (
          typeof item.mediaUUID !== 'string' ||
          typeof item.mediaURL !== 'string' ||
          typeof item.name !== 'string' ||
          typeof item.addedAt !== 'number'
        ) {
          skipped++
          continue
        }
        if (existingUUIDs.has(item.mediaUUID)) {
          skipped++
          continue
        }
        toAdd.push(item)
        existingUUIDs.add(item.mediaUUID)
        imported++
      }

      const items = [...toAdd, ...existing]
      set({ items })
      persist(items)
      return { imported, skipped }
    } catch {
      return null
    }
  },

  clearError: () => set({ error: null }),
}))
