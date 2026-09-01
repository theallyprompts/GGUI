import { useState } from 'react'
import { FolderPlus, Pencil, X } from 'lucide-react'
import { useFoldersStore, type Folder } from '../store/folders.store'
import type { GenerationJob } from '../store/generation.store'

export const UNFILED_FOLDER_ID = '__unfiled__'

interface FolderRailProps {
  jobs: GenerationJob[]
  jobFolderMap: Record<string, string>
  activeFolderId: string | null
  onSelectFolder: (folderId: string | null) => void
  /** Called when a card being dragged is dropped on a folder chip (or the Unfiled chip, with null). */
  onDropJob: (jobId: string, folderId: string | null) => void
}

/** A horizontal rail of folder chips above the results grid — click one to filter the grid down
 *  to just its contents (folder view), or drag a card from the grid onto a chip to file it. */
export function FolderRail({ jobs, jobFolderMap, activeFolderId, onSelectFolder, onDropJob }: FolderRailProps) {
  const folders = useFoldersStore((s) => s.folders)
  const createFolder = useFoldersStore((s) => s.createFolder)
  const renameFolder = useFoldersStore((s) => s.renameFolder)
  const deleteFolder = useFoldersStore((s) => s.deleteFolder)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const [deletingFolder, setDeletingFolder] = useState<Folder | null>(null)

  const existingJobIds = new Set(jobs.map((j) => j.id))
  const countForFolder = (folderId: string) =>
    Object.entries(jobFolderMap).filter(([jobId, fId]) => fId === folderId && existingJobIds.has(jobId)).length
  const unfiledCount = jobs.length - Object.keys(jobFolderMap).filter((jobId) => existingJobIds.has(jobId)).length

  function handleCreate() {
    const folder = createFolder('New folder')
    setEditingId(folder.id)
    setEditingName(folder.name)
  }

  function commitRename() {
    if (editingId) renameFolder(editingId, editingName)
    setEditingId(null)
  }

  function handleDrop(e: React.DragEvent, folderId: string | null) {
    e.preventDefault()
    setDragOverId(null)
    const jobId = e.dataTransfer.getData('text/runware-job-id')
    if (jobId) onDropJob(jobId, folderId)
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 border-b border-neutral-70 bg-card px-4 py-2">
      <FolderChip
        label="Unfiled"
        count={unfiledCount}
        active={activeFolderId === UNFILED_FOLDER_ID}
        draggedOver={dragOverId === UNFILED_FOLDER_ID}
        onClick={() => onSelectFolder(activeFolderId === UNFILED_FOLDER_ID ? null : UNFILED_FOLDER_ID)}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOverId(UNFILED_FOLDER_ID)
        }}
        onDragLeave={() => setDragOverId(null)}
        onDrop={(e) => handleDrop(e, null)}
      />
      {folders.map((folder) =>
        editingId === folder.id ? (
          <input
            key={folder.id}
            autoFocus
            value={editingName}
            onChange={(e) => setEditingName(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitRename()
              if (e.key === 'Escape') setEditingId(null)
            }}
            className="h-7 w-32 rounded-md border border-brand-green-text bg-input px-2 text-xs text-neutral-5 outline-none"
          />
        ) : (
          <FolderChip
            key={folder.id}
            label={folder.name}
            count={countForFolder(folder.id)}
            active={activeFolderId === folder.id}
            draggedOver={dragOverId === folder.id}
            onClick={() => onSelectFolder(activeFolderId === folder.id ? null : folder.id)}
            onDragOver={(e) => {
              e.preventDefault()
              setDragOverId(folder.id)
            }}
            onDragLeave={() => setDragOverId(null)}
            onDrop={(e) => handleDrop(e, folder.id)}
            onRename={() => {
              setEditingId(folder.id)
              setEditingName(folder.name)
            }}
            onDelete={() => setDeletingFolder(folder)}
          />
        ),
      )}
      <button
        type="button"
        onClick={handleCreate}
        title="New folder"
        aria-label="New folder"
        className="flex h-7 items-center gap-1.5 rounded-md border border-dashed border-neutral-70 px-2.5 text-xs font-medium text-neutral-40 hover:border-brand-green-text hover:text-brand-green-text"
      >
        <FolderPlus className="h-3.5 w-3.5" />
        New folder
      </button>

      {deletingFolder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setDeletingFolder(null)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-lg border border-neutral-70 bg-card p-4 shadow-xl"
          >
            <p className="mb-3 text-sm text-neutral-20">
              Delete "{deletingFolder.name}"? Its images move back to Unfiled — nothing is deleted.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeletingFolder(null)}
                className="rounded-md border border-neutral-70 bg-input px-3 py-1.5 text-sm font-medium text-neutral-30 hover:bg-neutral-80"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteFolder(deletingFolder.id)
                  if (activeFolderId === deletingFolder.id) onSelectFolder(null)
                  setDeletingFolder(null)
                }}
                className="rounded-md bg-brand-destructive/10 px-3 py-1.5 text-sm font-medium text-brand-destructive hover:bg-brand-destructive/20"
              >
                Delete folder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function FolderChip({
  label,
  count,
  active,
  draggedOver,
  onClick,
  onDragOver,
  onDragLeave,
  onDrop,
  onRename,
  onDelete,
}: {
  label: string
  count: number
  active: boolean
  draggedOver: boolean
  onClick: () => void
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: () => void
  onDrop: (e: React.DragEvent) => void
  onRename?: () => void
  onDelete?: () => void
}) {
  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`group flex h-7 items-center gap-1 rounded-md border px-2.5 text-xs font-medium transition-colors ${
        draggedOver
          ? 'border-brand-green-text bg-brand-green/20 text-brand-green-text'
          : active
            ? 'border-brand-green-text bg-brand-green/10 text-brand-green-text'
            : 'border-neutral-70 bg-input text-neutral-30 hover:bg-neutral-80'
      }`}
    >
      <button type="button" onClick={onClick} className="flex items-center gap-1.5">
        {label}
        <span className="font-mono text-[10px] text-neutral-50">{count}</span>
      </button>
      {onRename && (
        <button
          type="button"
          onClick={onRename}
          aria-label={`Rename ${label}`}
          className="hidden text-neutral-40 hover:text-neutral-5 group-hover:block"
        >
          <Pencil className="h-3 w-3" />
        </button>
      )}
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Delete ${label}`}
          className="hidden text-neutral-40 hover:text-brand-destructive group-hover:block"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  )
}
