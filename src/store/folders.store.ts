import { create } from 'zustand'

const FOLDERS_STORAGE_KEY = 'runware-generator:folders'
const JOB_FOLDER_MAP_STORAGE_KEY = 'runware-generator:job-folder-map'

export interface Folder {
  id: string
  name: string
  createdAt: number
}

let folderIdCounter = 0
function nextFolderId(): string {
  folderIdCounter += 1
  return `folder-${Date.now()}-${folderIdCounter}`
}

function loadFolders(): Folder[] {
  try {
    const raw = localStorage.getItem(FOLDERS_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (f): f is Folder =>
        typeof f === 'object' && f !== null && typeof f.id === 'string' && typeof f.name === 'string',
    )
  } catch {
    return []
  }
}

/** Maps a job id to the id of the one folder it's filed into — a job absent from this map (or
 *  whose folder id no longer exists) is "Unfiled". A job belongs to at most one folder. */
function loadJobFolderMap(): Record<string, string> {
  try {
    const raw = localStorage.getItem(JOB_FOLDER_MAP_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (typeof parsed !== 'object' || parsed === null) return {}
    return parsed as Record<string, string>
  } catch {
    return {}
  }
}

function persistFolders(folders: Folder[]) {
  try {
    localStorage.setItem(FOLDERS_STORAGE_KEY, JSON.stringify(folders))
  } catch {
    // localStorage full or unavailable — persistence is best-effort.
  }
}

function persistJobFolderMap(map: Record<string, string>) {
  try {
    localStorage.setItem(JOB_FOLDER_MAP_STORAGE_KEY, JSON.stringify(map))
  } catch {
    // localStorage full or unavailable — persistence is best-effort.
  }
}

interface FoldersState {
  folders: Folder[]
  /** jobId -> folderId */
  jobFolderMap: Record<string, string>

  createFolder: (name: string) => Folder
  renameFolder: (id: string, name: string) => void
  /** Deletes the folder; any jobs filed into it become Unfiled again (their media/history is untouched). */
  deleteFolder: (id: string) => void
  /** Files a job into a folder, or back to Unfiled if `folderId` is null. */
  moveJobToFolder: (jobId: string, folderId: string | null) => void
  /** Bulk version of moveJobToFolder, for "move selected to folder" actions. */
  moveJobsToFolder: (jobIds: string[], folderId: string | null) => void
  folderIdForJob: (jobId: string) => string | null
}

export const useFoldersStore = create<FoldersState>((set, get) => ({
  folders: loadFolders(),
  jobFolderMap: loadJobFolderMap(),

  createFolder: (name) => {
    const folder: Folder = { id: nextFolderId(), name: name.trim() || 'Untitled folder', createdAt: Date.now() }
    const folders = [...get().folders, folder]
    set({ folders })
    persistFolders(folders)
    return folder
  },

  renameFolder: (id, name) => {
    const trimmed = name.trim()
    if (!trimmed) return
    const folders = get().folders.map((f) => (f.id === id ? { ...f, name: trimmed } : f))
    set({ folders })
    persistFolders(folders)
  },

  deleteFolder: (id) => {
    const folders = get().folders.filter((f) => f.id !== id)
    const jobFolderMap = Object.fromEntries(
      Object.entries(get().jobFolderMap).filter(([, folderId]) => folderId !== id),
    )
    set({ folders, jobFolderMap })
    persistFolders(folders)
    persistJobFolderMap(jobFolderMap)
  },

  moveJobToFolder: (jobId, folderId) => {
    const map = { ...get().jobFolderMap }
    if (folderId) map[jobId] = folderId
    else delete map[jobId]
    set({ jobFolderMap: map })
    persistJobFolderMap(map)
  },

  moveJobsToFolder: (jobIds, folderId) => {
    const map = { ...get().jobFolderMap }
    for (const jobId of jobIds) {
      if (folderId) map[jobId] = folderId
      else delete map[jobId]
    }
    set({ jobFolderMap: map })
    persistJobFolderMap(map)
  },

  folderIdForJob: (jobId) => {
    const folderId = get().jobFolderMap[jobId]
    if (!folderId) return null
    return get().folders.some((f) => f.id === folderId) ? folderId : null
  },
}))
