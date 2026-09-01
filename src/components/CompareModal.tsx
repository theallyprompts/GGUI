import { useRef, useState } from 'react'
import { Columns2, SlidersHorizontal } from 'lucide-react'
import { Modal } from './Modal'

interface CompareModalProps {
  left: { url: string; label: string }
  right: { url: string; label: string }
  onClose: () => void
}

type CompareMode = 'slider' | 'side-by-side'

export function CompareModal({ left, right, onClose }: CompareModalProps) {
  const [mode, setMode] = useState<CompareMode>('slider')
  const [position, setPosition] = useState(50)
  const containerRef = useRef<HTMLDivElement>(null)
  const draggingRef = useRef(false)

  function updatePositionFromClientX(clientX: number) {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const pct = ((clientX - rect.left) / rect.width) * 100
    setPosition(Math.min(100, Math.max(0, pct)))
  }

  function handlePointerDown(e: React.PointerEvent) {
    draggingRef.current = true
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    updatePositionFromClientX(e.clientX)
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!draggingRef.current) return
    updatePositionFromClientX(e.clientX)
  }

  function handlePointerUp() {
    draggingRef.current = false
  }

  return (
    <Modal title="Compare" onClose={onClose} widthClassName="max-w-5xl">
      <div className="space-y-3">
        <div className="flex items-center justify-center">
          <div className="flex items-center rounded-md border border-neutral-70 bg-input p-0.5">
            <button
              type="button"
              onClick={() => setMode('slider')}
              className={`flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium ${
                mode === 'slider' ? 'bg-neutral-70 text-neutral-5' : 'text-neutral-40 hover:text-neutral-20'
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Slider
            </button>
            <button
              type="button"
              onClick={() => setMode('side-by-side')}
              className={`flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium ${
                mode === 'side-by-side' ? 'bg-neutral-70 text-neutral-5' : 'text-neutral-40 hover:text-neutral-20'
              }`}
            >
              <Columns2 className="h-3.5 w-3.5" />
              Side by side
            </button>
          </div>
        </div>

        {mode === 'slider' ? (
          <div
            ref={containerRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="relative aspect-video max-h-[70vh] w-full cursor-ew-resize touch-none select-none overflow-hidden rounded-md bg-bg"
          >
            <img
              src={right.url}
              alt={right.label}
              draggable={false}
              className="pointer-events-none absolute inset-0 h-full w-full object-contain"
            />
            <div
              className="pointer-events-none absolute inset-0 h-full w-full overflow-hidden"
              style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
            >
              <img
                src={left.url}
                alt={left.label}
                draggable={false}
                className="h-full w-full object-contain"
              />
            </div>
            <div
              className="pointer-events-none absolute inset-y-0 w-0.5 bg-brand-green"
              style={{ left: `${position}%` }}
            >
              <div className="absolute left-1/2 top-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-brand-green-text bg-neutral-100 shadow-lg">
                <SlidersHorizontal className="h-3.5 w-3.5 text-brand-green-text" />
              </div>
            </div>
            <span className="absolute left-2 top-2 rounded bg-neutral-100/70 px-2 py-1 text-xs text-neutral-5 backdrop-blur">
              {left.label}
            </span>
            <span className="absolute right-2 top-2 rounded bg-neutral-100/70 px-2 py-1 text-xs text-neutral-5 backdrop-blur">
              {right.label}
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="relative overflow-hidden rounded-md bg-bg">
              <img src={left.url} alt={left.label} className="max-h-[70vh] w-full object-contain" />
              <span className="absolute left-2 top-2 rounded bg-neutral-100/70 px-2 py-1 text-xs text-neutral-5 backdrop-blur">
                {left.label}
              </span>
            </div>
            <div className="relative overflow-hidden rounded-md bg-bg">
              <img src={right.url} alt={right.label} className="max-h-[70vh] w-full object-contain" />
              <span className="absolute left-2 top-2 rounded bg-neutral-100/70 px-2 py-1 text-xs text-neutral-5 backdrop-blur">
                {right.label}
              </span>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
