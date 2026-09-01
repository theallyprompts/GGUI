import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, Eraser, Paintbrush, Trash2 } from 'lucide-react'
import { Modal } from '../../Modal'

interface MaskEditorProps {
  image: string
  initialMask: string | null
  maskMargin: number
  onSave: (maskDataUri: string | null) => void
  onClose: () => void
}

/** Smallest side (in px) a painted mask region should have, in Runware's coordinate space. */
const MIN_RECOMMENDED_MASK_SIZE = 64

/** Bounding box of the painted (non-black) region, in mask-canvas pixel space. */
function getMaskBounds(maskCanvas: HTMLCanvasElement): { width: number; height: number } | null {
  const ctx = maskCanvas.getContext('2d')!
  const { data, width, height } = ctx.getImageData(0, 0, maskCanvas.width, maskCanvas.height)
  let minX = width
  let minY = height
  let maxX = -1
  let maxY = -1
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const luminance = data[(y * width + x) * 4]
      if (luminance > 10) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }
  if (maxX < minX || maxY < minY) return null
  return { width: maxX - minX + 1, height: maxY - minY + 1 }
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

export function MaskEditor({ image, initialMask, maskMargin, onSave, onClose }: MaskEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const isDrawing = useRef(false)
  const lastPoint = useRef<{ x: number; y: number } | null>(null)
  const [brushSize, setBrushSize] = useState(40)
  const [tool, setTool] = useState<'brush' | 'eraser'>('brush')
  const [isReady, setIsReady] = useState(false)
  const [maskBounds, setMaskBounds] = useState<{ width: number; height: number } | null>(null)

  const isMaskTooSmall =
    maskBounds !== null &&
    Math.min(maskBounds.width, maskBounds.height) < Math.max(MIN_RECOMMENDED_MASK_SIZE, maskMargin)

  // Load the source image, size the visible canvas to it, and seed the
  // off-screen mask canvas from any previously-saved mask.
  useEffect(() => {
    let cancelled = false
    void loadImage(image).then((img) => {
      if (cancelled) return
      const canvas = canvasRef.current
      if (!canvas) return
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight

      const maskCanvas = document.createElement('canvas')
      maskCanvas.width = img.naturalWidth
      maskCanvas.height = img.naturalHeight
      maskCanvasRef.current = maskCanvas
      const maskCtx = maskCanvas.getContext('2d')!
      maskCtx.fillStyle = 'black'
      maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height)

      function paint() {
        if (cancelled) return
        const ctx = canvas!.getContext('2d')!
        ctx.clearRect(0, 0, canvas!.width, canvas!.height)
        ctx.drawImage(img, 0, 0)

        // Build a red translucent overlay whose alpha follows the mask's
        // white (=edit) regions. The mask canvas has no transparency of its
        // own (black is opaque), so we read pixel luminance to derive alpha
        // rather than relying on compositing operators against it directly.
        const maskCtx2 = maskCanvas.getContext('2d')!
        const maskData = maskCtx2.getImageData(0, 0, maskCanvas.width, maskCanvas.height)
        const overlay = document.createElement('canvas')
        overlay.width = canvas!.width
        overlay.height = canvas!.height
        const overlayCtx = overlay.getContext('2d')!
        const overlayData = overlayCtx.createImageData(overlay.width, overlay.height)
        for (let i = 0; i < maskData.data.length; i += 4) {
          const luminance = maskData.data[i] // mask is grayscale: R=G=B
          overlayData.data[i] = 255
          overlayData.data[i + 1] = 80
          overlayData.data[i + 2] = 80
          overlayData.data[i + 3] = Math.round((luminance / 255) * 160)
        }
        overlayCtx.putImageData(overlayData, 0, 0)
        ctx.drawImage(overlay, 0, 0)
        setIsReady(true)
      }

      if (initialMask) {
        void loadImage(initialMask).then((maskImg) => {
          if (cancelled) return
          maskCtx.drawImage(maskImg, 0, 0, maskCanvas.width, maskCanvas.height)
          paint()
          setMaskBounds(getMaskBounds(maskCanvas))
        })
      } else {
        paint()
      }

      canvas.dataset.redraw = 'pending'
      ;(canvas as HTMLCanvasElement & { __redraw?: () => void }).__redraw = paint
    })
    return () => {
      cancelled = true
    }
  }, [image, initialMask])

  function getCanvasPoint(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY }
  }

  function redraw() {
    const canvas = canvasRef.current as (HTMLCanvasElement & { __redraw?: () => void }) | null
    canvas?.__redraw?.()
    if (maskCanvasRef.current) setMaskBounds(getMaskBounds(maskCanvasRef.current))
  }

  function drawStroke(from: { x: number; y: number }, to: { x: number; y: number }) {
    const maskCanvas = maskCanvasRef.current
    if (!maskCanvas) return
    const ctx = maskCanvas.getContext('2d')!
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineWidth = brushSize
    ctx.strokeStyle = tool === 'brush' ? 'white' : 'black'
    ctx.beginPath()
    ctx.moveTo(from.x, from.y)
    ctx.lineTo(to.x, to.y)
    ctx.stroke()
    redraw()
  }

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    ;(e.target as HTMLCanvasElement).setPointerCapture(e.pointerId)
    isDrawing.current = true
    const point = getCanvasPoint(e)
    lastPoint.current = point
    drawStroke(point, point)
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawing.current || !lastPoint.current) return
    const point = getCanvasPoint(e)
    drawStroke(lastPoint.current, point)
    lastPoint.current = point
  }

  function handlePointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = e.target as HTMLCanvasElement
    if (canvas.hasPointerCapture?.(e.pointerId)) canvas.releasePointerCapture(e.pointerId)
    isDrawing.current = false
    lastPoint.current = null
  }

  function handleClear() {
    const maskCanvas = maskCanvasRef.current
    if (!maskCanvas) return
    const ctx = maskCanvas.getContext('2d')!
    ctx.fillStyle = 'black'
    ctx.fillRect(0, 0, maskCanvas.width, maskCanvas.height)
    redraw()
  }

  function handleSave() {
    const maskCanvas = maskCanvasRef.current
    if (!maskCanvas) return
    onSave(getMaskBounds(maskCanvas) ? maskCanvas.toDataURL('image/png') : null)
  }

  return (
    <Modal title="Edit inpaint mask" onClose={onClose} widthClassName="max-w-2xl">
      <div className="flex flex-col gap-3">
        <p className="text-xs text-neutral-40">
          Paint over the area you want the model to edit. Painted (red) regions will be
          regenerated; everything else is preserved.
        </p>

        <div className="flex items-center gap-3">
          <div className="flex overflow-hidden rounded-md border border-neutral-70">
            <button
              type="button"
              onClick={() => setTool('brush')}
              aria-label="Brush"
              title="Brush"
              className={`p-2 transition-colors ${tool === 'brush' ? 'bg-neutral-5 text-neutral-100' : 'bg-input text-neutral-30 hover:bg-neutral-80'}`}
            >
              <Paintbrush className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setTool('eraser')}
              aria-label="Eraser"
              title="Eraser"
              className={`border-l border-neutral-70 p-2 transition-colors ${tool === 'eraser' ? 'bg-neutral-5 text-neutral-100' : 'bg-input text-neutral-30 hover:bg-neutral-80'}`}
            >
              <Eraser className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-1 items-center gap-2">
            <span className="text-xs whitespace-nowrap text-neutral-20">Brush size</span>
            <input
              type="range"
              min={5}
              max={150}
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="w-full accent-brand-green"
            />
          </div>

          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear mask"
            title="Clear mask"
            className="rounded-md border border-neutral-70 bg-input p-2 text-neutral-30 transition-colors hover:bg-neutral-80 hover:text-neutral-5"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center justify-center overflow-hidden rounded-md border border-neutral-70 bg-black">
          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            className={`max-h-[60vh] w-full touch-none object-contain ${isReady ? '' : 'opacity-0'}`}
          />
        </div>

        <div
          className={`flex items-start gap-2 rounded-md border border-brand-yellow/40 bg-brand-yellow/10 px-3 py-2 text-xs text-brand-yellow transition-opacity ${
            isMaskTooSmall ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
          aria-hidden={!isMaskTooSmall}
        >
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            This mask is quite small relative to the current mask margin ({maskMargin}px). Runware
            pads every masked edit with that margin, so a small mask may pull in much more
            surrounding image than expected. Paint a larger area or lower the mask margin.
          </span>
        </div>

        <div className="flex justify-end gap-2">
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
            Save mask
          </button>
        </div>
      </div>
    </Modal>
  )
}
