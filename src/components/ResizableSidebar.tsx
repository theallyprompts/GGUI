import { useCallback, useEffect, useRef, useState } from 'react'

const STORAGE_KEY = 'runware-generator:sidebar-width'
const MIN_WIDTH = 320
const MAX_WIDTH = 560
const DEFAULT_WIDTH = 340

function loadWidth(): number {
  const stored = Number(localStorage.getItem(STORAGE_KEY))
  if (Number.isFinite(stored) && stored >= MIN_WIDTH && stored <= MAX_WIDTH) return stored
  return DEFAULT_WIDTH
}

export function ResizableSidebar({
  children,
  className = 'block',
}: {
  children: React.ReactNode
  className?: string
}) {
  const [width, setWidth] = useState(loadWidth)
  const [dragging, setDragging] = useState(false)
  const startRef = useRef({ x: 0, width: 0 })

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      startRef.current = { x: e.clientX, width }
      setDragging(true)
    },
    [width],
  )

  useEffect(() => {
    if (!dragging) return

    function handlePointerMove(e: PointerEvent) {
      const delta = e.clientX - startRef.current.x
      const next = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startRef.current.width + delta))
      setWidth(next)
    }

    function handlePointerUp() {
      setDragging(false)
    }

    document.addEventListener('pointermove', handlePointerMove)
    document.addEventListener('pointerup', handlePointerUp)
    return () => {
      document.removeEventListener('pointermove', handlePointerMove)
      document.removeEventListener('pointerup', handlePointerUp)
    }
  }, [dragging])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(width))
  }, [width])

  return (
    <aside
      style={{ '--sidebar-width': `${width}px` } as React.CSSProperties}
      className={`relative h-full w-full min-w-0 flex-shrink-0 overflow-hidden border-r border-neutral-70 md:w-[var(--sidebar-width)] ${className}`}
    >
      {children}
      <div
        onPointerDown={handlePointerDown}
        className={`absolute right-0 top-0 hidden h-full w-1 -translate-x-1/2 cursor-col-resize select-none md:block ${
          dragging ? 'bg-brand-green/40' : 'hover:bg-brand-green/20'
        }`}
      />
    </aside>
  )
}
