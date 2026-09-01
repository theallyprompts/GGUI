import { useEffect, useRef, useState } from 'react'
import { Modal } from '../../Modal'
import { NumericSlider } from '../../NumericSlider'
import { snapDimension, type ImageInferenceModelDefinition } from '../../../lib/models'
import type { OutpaintSpec } from '../../../lib/runware/types'

interface OutpaintEditorProps {
  image: string
  model: ImageInferenceModelDefinition
  initialOutpaint: OutpaintSpec | null
  onSave: (outpaint: OutpaintSpec | null, dimensions: { width: number; height: number }) => void
  onClose: () => void
}

type Edge = 'top' | 'bottom' | 'left' | 'right'

/** Max width/height of the editor's visible canvas frame, in CSS pixels. */
const VIEWPORT_SIZE = 480
const HANDLE_THICKNESS = 14

/** Runware requires each outpaint direction to be an integer multiple of this. */
const OUTPAINT_STEP = 64

function snapOutpaintExtent(n: number): number {
  return Math.max(0, Math.round(n / OUTPAINT_STEP) * OUTPAINT_STEP)
}

/** Loads an image element from a data URI/URL, resolving once it's decoded. */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

export function OutpaintEditor({ image, model, initialOutpaint, onSave, onClose }: OutpaintEditorProps) {
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null)
  const [extents, setExtents] = useState({
    top: snapOutpaintExtent(initialOutpaint?.top ?? 0),
    bottom: snapOutpaintExtent(initialOutpaint?.bottom ?? 0),
    left: snapOutpaintExtent(initialOutpaint?.left ?? 0),
    right: snapOutpaintExtent(initialOutpaint?.right ?? 0),
  })
  const [blur, setBlur] = useState(initialOutpaint?.blur ?? 8)
  const dragState = useRef<{ edge: Edge; startClient: number; startValue: number } | null>(null)

  useEffect(() => {
    void loadImage(image).then((img) =>
      setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight }),
    )
  }, [image])

  useEffect(() => {
    function handleMove(e: PointerEvent) {
      const drag = dragState.current
      if (!drag || !naturalSize) return
      const scale = getScale()
      const deltaCss = drag.edge === 'left' || drag.edge === 'right'
        ? e.clientX - drag.startClient
        : e.clientY - drag.startClient
      const sign = drag.edge === 'left' || drag.edge === 'top' ? -1 : 1
      const deltaImagePx = Math.round((deltaCss * sign) / scale)
      const nextValue = snapOutpaintExtent(drag.startValue + deltaImagePx)
      setExtents((prev) => ({ ...prev, [drag.edge]: nextValue }))
    }
    function handleUp() {
      dragState.current = null
    }
    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
    return () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [naturalSize])

  if (!naturalSize) {
    return (
      <Modal title="Extend canvas" onClose={onClose} widthClassName="max-w-2xl">
        <div className="flex h-64 items-center justify-center text-sm text-neutral-40">Loading…</div>
      </Modal>
    )
  }

  const totalWidth = naturalSize.width + extents.left + extents.right
  const totalHeight = naturalSize.height + extents.top + extents.bottom

  function getScale() {
    if (!naturalSize) return 1
    const maxExtent = Math.max(naturalSize.width, naturalSize.height) * 3
    const frameSize = Math.min(VIEWPORT_SIZE, maxExtent)
    return frameSize / Math.max(totalWidth, totalHeight, naturalSize.width, naturalSize.height)
  }

  const scale = getScale()
  const frameWidth = totalWidth * scale
  const frameHeight = totalHeight * scale
  const imgWidth = naturalSize.width * scale
  const imgHeight = naturalSize.height * scale
  const imgLeft = extents.left * scale
  const imgTop = extents.top * scale

  const finalDimensions = {
    width: snapDimension(model, totalWidth),
    height: snapDimension(model, totalHeight),
  }

  function startDrag(edge: Edge) {
    return (e: React.PointerEvent) => {
      e.preventDefault()
      dragState.current = {
        edge,
        startClient: edge === 'left' || edge === 'right' ? e.clientX : e.clientY,
        startValue: extents[edge],
      }
    }
  }

  function handleReset() {
    setExtents({ top: 0, bottom: 0, left: 0, right: 0 })
  }

  function handleSave() {
    const hasExtension = extents.top || extents.bottom || extents.left || extents.right
    if (!hasExtension) {
      onSave(null, finalDimensions)
      return
    }
    onSave({ ...extents, blur }, finalDimensions)
  }

  return (
    <Modal title="Extend canvas" onClose={onClose} widthClassName="max-w-2xl">
      <div className="flex flex-col gap-3">
        <p className="text-xs text-neutral-40">
          Drag an edge to extend the canvas in that direction. The model will fill the new area
          based on your prompt, blended with the original image. Extensions snap to 64px
          increments, as required by Runware.
        </p>

        <div className="flex items-center justify-between rounded-md border border-neutral-70 bg-card px-3 py-2 text-xs">
          <span className="text-neutral-30">Final size</span>
          <span className="font-mono text-neutral-5">
            {finalDimensions.width}×{finalDimensions.height}
          </span>
        </div>

        <div className="flex items-center justify-center overflow-auto rounded-md border border-neutral-70 bg-neutral-90 p-6">
          <div
            className="relative shrink-0"
            style={{ width: frameWidth + HANDLE_THICKNESS * 2, height: frameHeight + HANDLE_THICKNESS * 2 }}
          >
            <div
              className="absolute border border-dashed border-brand-green-text/50 bg-brand-green/5"
              style={{ left: HANDLE_THICKNESS, top: HANDLE_THICKNESS, width: frameWidth, height: frameHeight }}
            />
            <img
              src={image}
              alt="Input"
              draggable={false}
              className="absolute select-none"
              style={{
                left: HANDLE_THICKNESS + imgLeft,
                top: HANDLE_THICKNESS + imgTop,
                width: imgWidth,
                height: imgHeight,
              }}
            />

            {/* Edge drag handles */}
            <div
              onPointerDown={startDrag('top')}
              title="Drag to extend top"
              className="absolute cursor-ns-resize touch-none rounded-full bg-brand-green/70 transition-colors hover:bg-brand-green"
              style={{
                left: HANDLE_THICKNESS + frameWidth / 2 - 18,
                top: 0,
                width: 36,
                height: HANDLE_THICKNESS,
              }}
            />
            <div
              onPointerDown={startDrag('bottom')}
              title="Drag to extend bottom"
              className="absolute cursor-ns-resize touch-none rounded-full bg-brand-green/70 transition-colors hover:bg-brand-green"
              style={{
                left: HANDLE_THICKNESS + frameWidth / 2 - 18,
                top: HANDLE_THICKNESS + frameHeight,
                width: 36,
                height: HANDLE_THICKNESS,
              }}
            />
            <div
              onPointerDown={startDrag('left')}
              title="Drag to extend left"
              className="absolute cursor-ew-resize touch-none rounded-full bg-brand-green/70 transition-colors hover:bg-brand-green"
              style={{
                left: 0,
                top: HANDLE_THICKNESS + frameHeight / 2 - 18,
                width: HANDLE_THICKNESS,
                height: 36,
              }}
            />
            <div
              onPointerDown={startDrag('right')}
              title="Drag to extend right"
              className="absolute cursor-ew-resize touch-none rounded-full bg-brand-green/70 transition-colors hover:bg-brand-green"
              style={{
                left: HANDLE_THICKNESS + frameWidth,
                top: HANDLE_THICKNESS + frameHeight / 2 - 18,
                width: HANDLE_THICKNESS,
                height: 36,
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          {(['top', 'bottom', 'left', 'right'] as const).map((edge) => (
            <div key={edge} className="rounded-md border border-neutral-70 bg-input px-2 py-1.5">
              <div className="text-neutral-40 capitalize">{edge}</div>
              <div className="font-mono text-neutral-5">{extents[edge]}px</div>
            </div>
          ))}
        </div>

        <NumericSlider
          label="Edge blur"
          tooltip="Blurs the seam between the original image and the extended region so the model can blend it more smoothly."
          value={blur}
          min={0}
          max={32}
          onChange={setBlur}
        />

        <div className="flex justify-between gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="rounded-md border border-neutral-70 bg-input px-4 py-2 text-sm font-medium text-neutral-30 transition-colors hover:bg-neutral-80 hover:text-neutral-5"
          >
            Reset
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-neutral-70 bg-input px-4 py-2 text-sm font-medium text-neutral-30 transition-colors hover:bg-neutral-80 hover:text-neutral-5"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="rounded-md bg-brand-green px-4 py-2 text-sm font-semibold text-on-brand transition hover:bg-brand-green-mid"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
