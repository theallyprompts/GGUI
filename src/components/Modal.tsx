import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

interface ModalProps {
  title: string
  onClose: () => void
  children: React.ReactNode
  widthClassName?: string
  /** Rendered in the title bar, just left of the close button — for a modal-specific shortcut
   *  (e.g. "open Prompt Studio") that doesn't belong in every modal. */
  headerAction?: React.ReactNode
}

export function Modal({ title, onClose, children, widthClassName = 'max-w-md', headerAction }: ModalProps) {
  const pointerDownOnBackdrop = useRef(false)

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onPointerDown={(e) => {
        pointerDownOnBackdrop.current = e.target === e.currentTarget
      }}
      onClick={(e) => {
        if (pointerDownOnBackdrop.current && e.target === e.currentTarget) onClose()
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${widthClassName} max-h-[85vh] overflow-y-auto rounded-lg border border-neutral-70 bg-card shadow-xl`}
      >
        <div className="flex items-center justify-between border-b border-neutral-70 px-4 py-3">
          <h2 className="text-sm font-semibold text-neutral-5">{title}</h2>
          <div className="flex items-center gap-2">
            {headerAction}
            <button onClick={onClose} className="text-neutral-40 hover:text-neutral-5" aria-label="Close">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
