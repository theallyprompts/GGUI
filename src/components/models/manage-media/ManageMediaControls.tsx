import { useRef, useState } from 'react'
import { Download, ImagePlus, Loader2, Upload, UploadCloud, X, TriangleAlert } from 'lucide-react'
import { useApiKeyStore } from '../../../store/apiKey.store'
import { useMyMediaStore } from '../../../store/myMedia.store'

function readFileAsDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

/** Upload/export/import controls for the media library — lives in the generator form pane;
 *  the actual library grid + filters render in the results pane via ManageMediaGallery. */
export function ManageMediaControls() {
  const apiKey = useApiKeyStore((s) => s.apiKey)
  const items = useMyMediaStore((s) => s.items)
  const isUploading = useMyMediaStore((s) => s.isUploading)
  const error = useMyMediaStore((s) => s.error)
  const pendingUpload = useMyMediaStore((s) => s.pendingUpload)
  const setPendingUpload = useMyMediaStore((s) => s.setPendingUpload)
  const uploadPending = useMyMediaStore((s) => s.uploadPending)
  const exportLibrary = useMyMediaStore((s) => s.exportLibrary)
  const importLibrary = useMyMediaStore((s) => s.importLibrary)
  const clearError = useMyMediaStore((s) => s.clearError)

  const inputRef = useRef<HTMLInputElement>(null)
  const importInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [importMessage, setImportMessage] = useState<string | null>(null)
  const isVideoPending = pendingUpload ? pendingUpload.dataUri.startsWith('data:video/') : false

  async function handleFiles(files: FileList | null) {
    if (!files) return
    const file = Array.from(files).find(
      (f) => f.type.startsWith('image/') || f.type.startsWith('video/'),
    )
    if (!file) return
    const dataUri = await readFileAsDataUri(file)
    setPendingUpload({ name: file.name, dataUri })
  }

  function handleExport() {
    const json = exportLibrary()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'runware-generator-media-library.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleImportFile(file: File | undefined | null) {
    if (!file) return
    const text = await file.text()
    const result = importLibrary(text)
    if (!result) {
      setImportMessage("That file doesn't look like a media library export.")
    } else {
      setImportMessage(
        `Imported ${result.imported} item${result.imported === 1 ? '' : 's'}${
          result.skipped ? `, skipped ${result.skipped} (already present or invalid)` : ''
        }.`,
      )
    }
    setTimeout(() => setImportMessage(null), 5000)
  }

  if (!apiKey) {
    return <p className="p-4 text-center text-sm text-neutral-40">No API key set.</p>
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        <div className="rounded-md border border-neutral-70 bg-input p-3 text-xs text-neutral-30">
          <p className="mb-1 font-medium text-neutral-5">This library is tracked in this browser only</p>
          <p>
            Runware doesn't provide a way to list previously uploaded media, so this app remembers what
            you've uploaded locally. It won't show up in another browser or device unless you export and
            import your library there.
          </p>
        </div>

        <div>
          {pendingUpload ? (
            <div className="relative overflow-hidden rounded-md border border-neutral-70">
              {isVideoPending ? (
                <video src={pendingUpload.dataUri} muted className="max-h-48 w-full object-contain bg-input" />
              ) : (
                <img
                  src={pendingUpload.dataUri}
                  alt={pendingUpload.name}
                  className="max-h-48 w-full object-contain bg-input"
                />
              )}
              <button
                type="button"
                onClick={() => setPendingUpload(null)}
                aria-label="Discard"
                disabled={isUploading}
                className="absolute top-2 right-2 rounded-md bg-neutral-90/80 p-1.5 text-neutral-5 backdrop-blur transition-colors hover:bg-neutral-90 disabled:cursor-wait"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              <input
                value={pendingUpload.name}
                onChange={(e) => setPendingUpload({ ...pendingUpload, name: e.target.value })}
                disabled={isUploading}
                className="absolute inset-x-0 bottom-0 w-full bg-neutral-100/80 px-2 py-1.5 text-xs text-neutral-5 outline-none backdrop-blur disabled:cursor-wait"
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault()
                setIsDragging(false)
                void handleFiles(e.dataTransfer.files)
              }}
              className={`flex w-full flex-col items-center gap-1.5 rounded-md border border-dashed px-3 py-6 text-xs text-neutral-40 transition-colors ${
                isDragging
                  ? 'border-brand-green-text bg-brand-green/5'
                  : 'border-neutral-70 bg-input hover:bg-neutral-80 hover:text-neutral-5'
              }`}
            >
              <ImagePlus className="h-5 w-5" />
              Drop an image or video, or click to upload
            </button>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={(e) => {
              void handleFiles(e.target.files)
              e.target.value = ''
            }}
          />
        </div>

        {pendingUpload && (
          <button
            type="button"
            onClick={() => void uploadPending(apiKey)}
            disabled={isUploading}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-brand-green px-4 py-2.5 text-sm font-semibold text-on-brand transition hover:bg-brand-green-mid disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
            {isUploading ? 'Uploading…' : 'Upload to My Media'}
          </button>
        )}

        {error && (
          <p className="flex items-start gap-2 rounded-md border border-brand-destructive/30 bg-brand-destructive/10 p-3 text-sm text-brand-destructive">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="flex-1">{error}</span>
            <button onClick={clearError} className="text-brand-destructive/70 hover:text-brand-destructive">
              ✕
            </button>
          </p>
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExport}
            disabled={items.length === 0}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-neutral-70 bg-input px-3 py-2 text-xs font-medium text-neutral-20 transition-colors hover:bg-neutral-80 hover:text-neutral-5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" />
            Export library
          </button>
          <button
            type="button"
            onClick={() => importInputRef.current?.click()}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-neutral-70 bg-input px-3 py-2 text-xs font-medium text-neutral-20 transition-colors hover:bg-neutral-80 hover:text-neutral-5"
          >
            <Upload className="h-3.5 w-3.5" />
            Import library
          </button>
          <input
            ref={importInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              void handleImportFile(e.target.files?.[0])
              e.target.value = ''
            }}
          />
        </div>

        {importMessage && <p className="text-center text-xs text-neutral-40">{importMessage}</p>}
      </div>
    </div>
  )
}
