import { FolderCog } from 'lucide-react'
import { useMyMediaStore } from '../store/myMedia.store'
import { useGenerationStore } from '../store/generation.store'
import { MANAGE_MEDIA_MODEL } from '../lib/models'
import { Modal } from './Modal'

interface MyMediaPickerModalProps {
  onClose: () => void
  onSelect: (mediaURL: string) => void
  /** Restrict to image or video items — most input slots (reference images, frames, etc.) only accept images. */
  kind?: 'image' | 'video'
}

export function MyMediaPickerModal({ onClose, onSelect, kind = 'image' }: MyMediaPickerModalProps) {
  const items = useMyMediaStore((s) => s.items)
  const setModelId = useGenerationStore((s) => s.setModelId)

  const filtered = items.filter((item) => {
    const isVideo = /\.(mp4|webm|mov)($|\?)/i.test(item.mediaURL)
    return kind === 'video' ? isVideo : !isVideo
  })

  return (
    <Modal title="Insert from My Media" onClose={onClose} widthClassName="max-w-2xl">
      {filtered.length > 0 && (
        <button
          type="button"
          onClick={() => {
            setModelId(MANAGE_MEDIA_MODEL.id)
            onClose()
          }}
          className="mb-3 flex items-center gap-1.5 text-xs text-brand-green-text hover:underline"
        >
          <FolderCog className="h-3.5 w-3.5" />
          Manage My Media
        </button>
      )}
      {filtered.length === 0 ? (
        <p className="py-6 text-center text-sm text-neutral-40">
          No {kind === 'video' ? 'videos' : 'images'} in your media library yet. Upload some from the{' '}
          <button
            type="button"
            onClick={() => {
              setModelId(MANAGE_MEDIA_MODEL.id)
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
          {filtered.map((item) => (
            <button
              key={item.mediaUUID}
              type="button"
              onClick={() => {
                onSelect(item.mediaURL)
                onClose()
              }}
              className="group relative aspect-square overflow-hidden rounded-md border border-neutral-70 bg-input transition-colors hover:border-brand-green-text"
            >
              {kind === 'video' ? (
                <video src={item.mediaURL} muted className="h-full w-full object-cover" />
              ) : (
                <img src={item.mediaURL} alt={item.name} className="h-full w-full object-cover" />
              )}
              <div className="absolute inset-x-0 bottom-0 truncate bg-neutral-100/70 px-1.5 py-1 text-[10px] text-neutral-5 backdrop-blur">
                {item.name}
              </div>
            </button>
          ))}
        </div>
      )}
    </Modal>
  )
}
