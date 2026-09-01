import { useEffect } from 'react'

interface ImagePreviewModalProps {
  src: string
  onClose: () => void
}

export function ImagePreviewModal({ src, onClose }: ImagePreviewModalProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={onClose}>
      <button
        onClick={onClose}
        className="absolute right-4 top-4 text-2xl leading-none text-neutral-40 hover:text-neutral-5"
        aria-label="Close"
      >
        ✕
      </button>
      <img
        src={src}
        alt="Reference preview"
        onClick={(e) => e.stopPropagation()}
        className="max-h-full max-w-full rounded-lg object-contain"
      />
    </div>
  )
}
