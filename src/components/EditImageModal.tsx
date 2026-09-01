import { useEffect, useRef, useState } from 'react'
import {
  ArrowUpToLine,
  Check,
  Circle,
  Crop as CropIcon,
  Download,
  Eraser,
  EyeOff,
  FolderPlus,
  ImageDown,
  ImagePlus,
  Minus,
  MousePointer2,
  Pencil,
  RotateCcw,
  RotateCw,
  Sparkles,
  Square,
  SunMedium,
  Trash2,
  Type,
} from 'lucide-react'
import { Modal } from './Modal'

/** Instagram-style filter presets — each is a CSS `filter` function list, applied on top of the
 *  brightness/contrast sliders (both stack via the same CSS/canvas filter string). */
interface FilterPreset {
  label: string
  filter: string
}

const FILTER_PRESETS: FilterPreset[] = [
  { label: 'Original', filter: '' },
  { label: 'Clarendon', filter: 'saturate(1.4) contrast(1.15) brightness(1.05)' },
  { label: 'Gingham', filter: 'sepia(0.25) contrast(0.9) brightness(1.1) saturate(0.9)' },
  { label: 'Moon', filter: 'grayscale(1) contrast(1.1) brightness(1.1)' },
  { label: 'Lark', filter: 'saturate(1.2) contrast(0.9) brightness(1.1)' },
  { label: 'Reyes', filter: 'sepia(0.4) contrast(0.85) brightness(1.1) saturate(0.75)' },
  { label: 'Juno', filter: 'saturate(1.4) contrast(1.1) sepia(0.15)' },
  { label: 'Slumber', filter: 'saturate(0.66) brightness(1.05) sepia(0.3)' },
  { label: 'Ludwig', filter: 'saturate(1.05) contrast(1.05) sepia(0.1) brightness(1.05)' },
  { label: 'Aden', filter: 'hue-rotate(-20deg) contrast(0.9) saturate(0.85) brightness(1.2)' },
  { label: 'Perpetua', filter: 'saturate(1.1) contrast(1.1) brightness(1.05)' },
  { label: 'Noir', filter: 'grayscale(1) contrast(1.3) brightness(0.95)' },
  { label: 'Vintage', filter: 'sepia(0.5) contrast(0.9) saturate(0.7) brightness(0.95)' },
]

/** Combines a filter preset with the brightness/contrast sliders into one CSS filter string —
 *  used identically for the live SVG preview and the final canvas bake, so what's on screen is
 *  exactly what gets rendered out. */
function composeFilter(presetFilter: string, brightness: number, contrast: number): string {
  return `${presetFilter ? presetFilter + ' ' : ''}brightness(${brightness}%) contrast(${contrast}%)`
}

interface EditImageModalProps {
  image: string
  suggestedName: string
  onClose: () => void
  /** Primary "commit and close" action for callers with no results-feed context of their own
   *  (e.g. annotating a reference image in place) — renders as the lone save button when none
   *  of the results-feed-specific actions below are provided. */
  onSave?: (dataUri: string) => void
  onDownload?: (dataUri: string) => void
  onSaveAsCopy?: (dataUri: string) => void
  onUseAsInput?: (dataUri: string) => void
  onSendToUpscale?: (dataUri: string) => void
  onSendToRemoveBackground?: (dataUri: string) => void
}

type Tool = 'select' | 'crop' | 'rect' | 'ellipse' | 'line' | 'draw' | 'eraser' | 'text'

interface ShapeBase {
  id: string
  color: string
  strokeWidth: number
}

interface RectLikeShape extends ShapeBase {
  type: 'rect' | 'ellipse'
  x: number
  y: number
  width: number
  height: number
}

interface RectShape extends RectLikeShape {
  type: 'rect'
}

interface EllipseShape extends RectLikeShape {
  type: 'ellipse'
}

interface LineShape extends ShapeBase {
  type: 'line'
  x1: number
  y1: number
  x2: number
  y2: number
}

interface DrawShape extends ShapeBase {
  type: 'draw'
  points: { x: number; y: number }[]
}

interface TextShape extends ShapeBase {
  type: 'text'
  x: number
  y: number
  text: string
  fontSize: number
}

/** A "sticker" — an image layered on top of the base image, freely movable and resizable via
 *  the same corner-handle drag used for the crop rect. */
interface ImageShape extends ShapeBase {
  type: 'image'
  x: number
  y: number
  width: number
  height: number
  src: string
  /** Degrees, about the shape's own center — stickers only; other shape types don't rotate. */
  rotation: number
}

type Shape = RectShape | EllipseShape | LineShape | DrawShape | TextShape | ImageShape

const COLORS = ['#ff4d4d', '#ffff7d', '#afff9f', '#6ea8ff', '#ffffff', '#1b1b1b']

/** Built-in sticker set — simple emoji rendered to a data URI at pick time, so stickers don't
 *  need any bundled image assets. Users can also upload their own via the picker. */
const BUILTIN_STICKERS = [
  '⭐', '❤️', '🔥', '✨', '🎉', '👍', '😂', '💯', '🚀', '🌈',
  '💦', '🥵', '🌶️', '🍆', '⚠️',
]

function emojiToDataUri(emoji: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><text x="50%" y="50%" font-size="108" text-anchor="middle" dominant-baseline="central">${emoji}</text></svg>`
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`
}

const CROP_ASPECT_OPTIONS: { label: string; ratio: number | null }[] = [
  { label: 'Free', ratio: null },
  { label: '1:1', ratio: 1 },
  { label: '4:3', ratio: 4 / 3 },
  { label: '16:9', ratio: 16 / 9 },
  { label: '9:16', ratio: 9 / 16 },
]

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/** Wraps a rotation value into (-180, 180], matching the slider's range. */
function normalizeRotation(degrees: number): number {
  const wrapped = ((degrees + 180) % 360 + 360) % 360 - 180
  return wrapped === -180 ? 180 : wrapped
}

/** The axis-aligned box that fully contains a width x height rectangle rotated by `degrees`
 *  about its center — the editing canvas grows to this size so free-angle rotation never
 *  clips the image; the corners left over are transparent. */
function rotatedBoundingBox(width: number, height: number, degrees: number): { width: number; height: number } {
  const radians = (degrees * Math.PI) / 180
  const cos = Math.abs(Math.cos(radians))
  const sin = Math.abs(Math.sin(radians))
  return {
    width: Math.round(width * cos + height * sin),
    height: Math.round(width * sin + height * cos),
  }
}

/** Rotates `point` by `degrees` about the center of `rect` — used to map a pointer position into
 *  a rotated shape's local (un-rotated) space before hit-testing its handles. */
function rotatePointAround(
  point: { x: number; y: number },
  rect: { x: number; y: number; width: number; height: number },
  degrees: number,
): { x: number; y: number } {
  const cx = rect.x + rect.width / 2
  const cy = rect.y + rect.height / 2
  const radians = (degrees * Math.PI) / 180
  const cos = Math.cos(radians)
  const sin = Math.sin(radians)
  const dx = point.x - cx
  const dy = point.y - cy
  return { x: cx + dx * cos - dy * sin, y: cy + dx * sin + dy * cos }
}

function distanceToSegment(p: { x: number; y: number }, a: { x: number; y: number }, b: { x: number; y: number }) {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const lengthSq = dx * dx + dy * dy
  if (lengthSq === 0) return Math.hypot(p.x - a.x, p.y - a.y)
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lengthSq
  t = Math.max(0, Math.min(1, t))
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy))
}

/** Hit-tests a point against a shape's visible extent, used by both the eraser tool and
 *  click-to-select — a shape is vector data, so "erasing" means deleting the whole object. */
function shapeContainsPoint(shape: Shape, point: { x: number; y: number }): boolean {
  const pad = Math.max(shape.strokeWidth, 6)
  switch (shape.type) {
    case 'rect':
    case 'image': {
      const x1 = Math.min(shape.x, shape.x + shape.width) - pad
      const x2 = Math.max(shape.x, shape.x + shape.width) + pad
      const y1 = Math.min(shape.y, shape.y + shape.height) - pad
      const y2 = Math.max(shape.y, shape.y + shape.height) + pad
      return point.x >= x1 && point.x <= x2 && point.y >= y1 && point.y <= y2
    }
    case 'ellipse': {
      const cx = shape.x + shape.width / 2
      const cy = shape.y + shape.height / 2
      const rx = Math.abs(shape.width) / 2 + pad
      const ry = Math.abs(shape.height) / 2 + pad
      if (rx === 0 || ry === 0) return false
      const nx = (point.x - cx) / rx
      const ny = (point.y - cy) / ry
      return nx * nx + ny * ny <= 1
    }
    case 'line':
      return distanceToSegment(point, { x: shape.x1, y: shape.y1 }, { x: shape.x2, y: shape.y2 }) <= pad
    case 'draw':
      return shape.points.some((_, i) => {
        if (i === 0) return false
        return distanceToSegment(point, shape.points[i - 1], shape.points[i]) <= pad
      })
    case 'text': {
      const width = shape.text.length * shape.fontSize * 0.6
      return (
        point.x >= shape.x - pad &&
        point.x <= shape.x + width + pad &&
        point.y >= shape.y - shape.fontSize - pad &&
        point.y <= shape.y + pad
      )
    }
  }
}

function boundsOf(shape: Shape): { x: number; y: number; width: number; height: number } {
  switch (shape.type) {
    case 'rect':
    case 'ellipse':
    case 'image':
      return {
        x: Math.min(shape.x, shape.x + shape.width),
        y: Math.min(shape.y, shape.y + shape.height),
        width: Math.abs(shape.width),
        height: Math.abs(shape.height),
      }
    case 'line':
      return {
        x: Math.min(shape.x1, shape.x2),
        y: Math.min(shape.y1, shape.y2),
        width: Math.abs(shape.x2 - shape.x1),
        height: Math.abs(shape.y2 - shape.y1),
      }
    case 'draw': {
      const xs = shape.points.map((p) => p.x)
      const ys = shape.points.map((p) => p.y)
      return { x: Math.min(...xs), y: Math.min(...ys), width: Math.max(...xs) - Math.min(...xs), height: Math.max(...ys) - Math.min(...ys) }
    }
    case 'text': {
      const width = shape.text.length * shape.fontSize * 0.6
      return { x: shape.x, y: shape.y - shape.fontSize, width, height: shape.fontSize * 1.2 }
    }
  }
}

/** rect/ellipse/image shapes share an (x, y, width, height) box and can be resized via corner
 *  drag handles, reusing the same hitTestCropHandle/resizeCrop math as the crop tool. */
function isResizableShape(shape: Shape): shape is RectShape | EllipseShape | ImageShape {
  return shape.type === 'rect' || shape.type === 'ellipse' || shape.type === 'image'
}

let shapeIdCounter = 0
function nextShapeId(): string {
  shapeIdCounter += 1
  return `shape-${shapeIdCounter}`
}

export function EditImageModal({
  image,
  suggestedName,
  onClose,
  onSave,
  onDownload,
  onSaveAsCopy,
  onUseAsInput,
  onSendToUpscale,
  onSendToRemoveBackground,
}: EditImageModalProps) {
  const [imgEl, setImgEl] = useState<HTMLImageElement | null>(null)
  const [rotation, setRotation] = useState(0)
  const [brightness, setBrightness] = useState(100)
  const [contrast, setContrast] = useState(100)
  const [filterPreset, setFilterPreset] = useState<FilterPreset>(FILTER_PRESETS[0])
  const [showFilters, setShowFilters] = useState(false)
  /** True while the "compare to original" button is held — temporarily shows the photo with no
   *  filter/brightness/contrast applied so the user can see what the edit actually changed. */
  const [showOriginal, setShowOriginal] = useState(false)
  const [showStickerPicker, setShowStickerPicker] = useState(false)
  const [tool, setTool] = useState<Tool>('select')
  const [color, setColor] = useState(COLORS[0])
  const [strokeWidth, setStrokeWidth] = useState(4)
  const [shapes, setShapes] = useState<Shape[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [cropRect, setCropRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const stickerFileInputRef = useRef<HTMLInputElement>(null)
  const [cropAspect, setCropAspect] = useState<number | null>(null)
  const [editingText, setEditingText] = useState<{ x: number; y: number } | null>(null)
  const [textDraft, setTextDraft] = useState('')
  const [showAdjustments, setShowAdjustments] = useState(false)
  const [showRotationSlider, setShowRotationSlider] = useState(false)

  const svgRef = useRef<SVGSVGElement>(null)
  /** Preloaded sticker images keyed by src, so render() can draw them onto canvas synchronously
   *  instead of needing to await image loads at bake time. Populated as stickers are added. */
  const stickerImagesRef = useRef<Map<string, HTMLImageElement>>(new Map())
  const dragState = useRef<{
    mode: 'draw-shape' | 'move-shape' | 'resize-shape' | 'rotate-shape' | 'resize-crop' | 'move-crop' | 'freehand'
    startX: number
    startY: number
    shape?: Shape
    origin?: { x: number; y: number; width: number; height: number }
    handle?: string
  } | null>(null)

  useEffect(() => {
    let cancelled = false
    void loadImage(image).then((img) => {
      if (!cancelled) setImgEl(img)
    })
    return () => {
      cancelled = true
    }
  }, [image])

  if (!imgEl) {
    return (
      <Modal title="Edit image" onClose={onClose} widthClassName="max-w-4xl">
        <p className="py-10 text-center text-sm text-neutral-40">Loading…</p>
      </Modal>
    )
  }

  const { width: displayWidth, height: displayHeight } = rotatedBoundingBox(
    imgEl.naturalWidth,
    imgEl.naturalHeight,
    rotation,
  )

  function svgPoint(e: React.PointerEvent): { x: number; y: number } {
    const svg = svgRef.current!
    const rect = svg.getBoundingClientRect()
    const scaleX = displayWidth / rect.width
    const scaleY = displayHeight / rect.height
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY }
  }

  function handleSurfacePointerDown(e: React.PointerEvent) {
    const point = svgPoint(e)
    // Capture on the SVG root itself, not e.target — capturing on a child element (e.g. a
    // resize-handle or delete-badge <circle>) causes subsequent pointermove/pointerup to be
    // delivered to that child instead of bubbling normally, which breaks the drag entirely and
    // can make the badge's own click misfire as a deselect on the surface below it.
    svgRef.current?.setPointerCapture?.(e.pointerId)

    if (tool === 'crop') {
      if (cropRect) {
        const handle = hitTestCropHandle(point, cropRect)
        if (handle) {
          dragState.current = { mode: 'resize-crop', startX: point.x, startY: point.y, origin: cropRect, handle }
          return
        }
        if (pointInRect(point, cropRect)) {
          dragState.current = { mode: 'move-crop', startX: point.x, startY: point.y, origin: cropRect }
          return
        }
      }
      setCropRect({ x: point.x, y: point.y, width: 0, height: 0 })
      dragState.current = { mode: 'resize-crop', startX: point.x, startY: point.y, origin: { x: point.x, y: point.y, width: 0, height: 0 }, handle: 'br' }
      return
    }

    if (tool === 'select') {
      const selected = shapes.find((s) => s.id === selectedId)
      // Image shapes (stickers) own dedicated onPointerDown handlers on their resize/rotate
      // handle elements (see handleStartResize/handleStartRotate below) — those stopPropagation
      // so this branch is only reached for non-image resizable shapes (rect/ellipse), which
      // don't rotate and so can use simple un-transformed distance-based hit-testing here.
      if (selected && isResizableShape(selected) && selected.type !== 'image') {
        const bounds = boundsOf(selected)
        const handle = hitTestCropHandle(point, bounds)
        if (handle) {
          dragState.current = { mode: 'resize-shape', startX: point.x, startY: point.y, shape: selected, origin: bounds, handle }
          return
        }
      }
      const hit = [...shapes].reverse().find((s) => shapeContainsPoint(s, point))
      setSelectedId(hit?.id ?? null)
      if (hit) dragState.current = { mode: 'move-shape', startX: point.x, startY: point.y, shape: hit }
      return
    }

    if (tool === 'eraser') {
      const hit = [...shapes].reverse().find((s) => shapeContainsPoint(s, point))
      if (hit) setShapes((prev) => prev.filter((s) => s.id !== hit.id))
      return
    }

    if (tool === 'text') {
      setEditingText(point)
      setTextDraft('')
      return
    }

    if (tool === 'draw') {
      const shape: DrawShape = { id: nextShapeId(), type: 'draw', points: [point], color, strokeWidth }
      setShapes((prev) => [...prev, shape])
      dragState.current = { mode: 'freehand', startX: point.x, startY: point.y, shape }
      return
    }

    if (tool === 'rect' || tool === 'ellipse') {
      const shape: RectShape | EllipseShape = { id: nextShapeId(), type: tool, x: point.x, y: point.y, width: 0, height: 0, color, strokeWidth }
      setShapes((prev) => [...prev, shape])
      dragState.current = { mode: 'draw-shape', startX: point.x, startY: point.y, shape }
      return
    }

    if (tool === 'line') {
      const shape: LineShape = { id: nextShapeId(), type: 'line', x1: point.x, y1: point.y, x2: point.x, y2: point.y, color, strokeWidth }
      setShapes((prev) => [...prev, shape])
      dragState.current = { mode: 'draw-shape', startX: point.x, startY: point.y, shape }
    }
  }

  /** Called directly from a resize-handle circle's own onPointerDown (see ShapeElement) instead
   *  of relying on distance-based hit-testing at the SVG root — the handle knows exactly which
   *  corner it is, so this sidesteps any coordinate-mapping mismatch between what the browser
   *  highlights on hover and what a manual hit-test would compute. */
  function handleStartResize(shape: ImageShape, handle: string, e: React.PointerEvent) {
    svgRef.current?.setPointerCapture?.(e.pointerId)
    const point = svgPoint(e)
    dragState.current = { mode: 'resize-shape', startX: point.x, startY: point.y, shape, origin: boundsOf(shape), handle }
  }

  /** Same rationale as handleStartResize, for the rotate handle. */
  function handleStartRotate(shape: ImageShape, e: React.PointerEvent) {
    svgRef.current?.setPointerCapture?.(e.pointerId)
    const point = svgPoint(e)
    dragState.current = { mode: 'rotate-shape', startX: point.x, startY: point.y, shape, origin: boundsOf(shape) }
  }

  function handleSurfacePointerMove(e: React.PointerEvent) {
    const drag = dragState.current
    if (!drag) return
    const point = svgPoint(e)

    if (drag.mode === 'resize-crop' && drag.origin) {
      setCropRect(resizeCrop(drag.origin, drag.handle!, point, cropAspect, displayWidth, displayHeight))
      return
    }
    if (drag.mode === 'move-crop' && drag.origin) {
      const dx = point.x - drag.startX
      const dy = point.y - drag.startY
      const { x, y, width, height } = drag.origin
      setCropRect({
        x: Math.max(0, Math.min(displayWidth - width, x + dx)),
        y: Math.max(0, Math.min(displayHeight - height, y + dy)),
        width,
        height,
      })
      return
    }
    if (drag.mode === 'move-shape' && drag.shape) {
      const dx = point.x - drag.startX
      const dy = point.y - drag.startY
      moveShape(drag.shape, dx, dy)
      return
    }
    if (drag.mode === 'resize-shape' && drag.origin && drag.shape) {
      // The dragged corner's own drawn position rotates with the sticker, but resizeCrop expects
      // a point in the shape's un-rotated local space (matching drag.origin) — rotate the live
      // pointer position back before handing it off.
      const rotation = drag.shape.type === 'image' ? drag.shape.rotation : 0
      const localPoint = rotation ? rotatePointAround(point, drag.origin, -rotation) : point
      const resized = resizeCrop(drag.origin, drag.handle!, localPoint, null, displayWidth, displayHeight)
      const shapeId = drag.shape.id
      setShapes((prev) =>
        prev.map((s) => (s.id === shapeId && isResizableShape(s) ? { ...s, ...resized } : s)),
      )
      return
    }
    if (drag.mode === 'rotate-shape' && drag.origin && drag.shape) {
      const cx = drag.origin.x + drag.origin.width / 2
      const cy = drag.origin.y + drag.origin.height / 2
      // Angle from the shape's center to the pointer, offset so "straight up" (the rotate
      // handle's rest position) maps to 0 degrees rather than 90.
      const angle = (Math.atan2(point.y - cy, point.x - cx) * 180) / Math.PI + 90
      const shapeId = drag.shape.id
      setShapes((prev) =>
        prev.map((s) => (s.id === shapeId && s.type === 'image' ? { ...s, rotation: angle } : s)),
      )
      return
    }
    if (drag.mode === 'freehand' && drag.shape?.type === 'draw') {
      const shapeId = drag.shape.id
      setShapes((prev) =>
        prev.map((s) => (s.id === shapeId && s.type === 'draw' ? { ...s, points: [...s.points, point] } : s)),
      )
      return
    }
    if (drag.mode === 'draw-shape' && drag.shape) {
      updateDraftShape(drag.shape, point)
    }
  }

  function handleSurfacePointerUp() {
    const drag = dragState.current
    if (drag?.mode === 'move-shape' && drag.shape) {
      dragState.current = { ...drag, startX: 0, startY: 0 }
    }
    dragState.current = null
  }

  function moveShape(shape: Shape, dx: number, dy: number) {
    setShapes((prev) =>
      prev.map((s) => {
        if (s.id !== shape.id) return s
        if (s.type === 'rect' || s.type === 'ellipse' || s.type === 'image') return { ...s, x: s.x + dx, y: s.y + dy }
        if (s.type === 'line') return { ...s, x1: s.x1 + dx, y1: s.y1 + dy, x2: s.x2 + dx, y2: s.y2 + dy }
        if (s.type === 'text') return { ...s, x: s.x + dx, y: s.y + dy }
        if (s.type === 'draw') return { ...s, points: s.points.map((p) => ({ x: p.x + dx, y: p.y + dy })) }
        return s
      }),
    )
    dragState.current = dragState.current && { ...dragState.current, startX: dragState.current.startX + dx, startY: dragState.current.startY + dy }
  }

  function updateDraftShape(shape: Shape, point: { x: number; y: number }) {
    setShapes((prev) =>
      prev.map((s) => {
        if (s.id !== shape.id) return s
        if (s.type === 'rect' || s.type === 'ellipse') return { ...s, width: point.x - s.x, height: point.y - s.y }
        if (s.type === 'line') return { ...s, x2: point.x, y2: point.y }
        return s
      }),
    )
  }

  function handleConfirmText() {
    if (editingText && textDraft.trim()) {
      const shape: TextShape = {
        id: nextShapeId(),
        type: 'text',
        x: editingText.x,
        y: editingText.y,
        text: textDraft,
        fontSize: 24,
        color,
        strokeWidth: 0,
      }
      setShapes((prev) => [...prev, shape])
    }
    setEditingText(null)
    setTextDraft('')
  }

  function handleDeleteSelected() {
    if (!selectedId) return
    setShapes((prev) => prev.filter((s) => s.id !== selectedId))
    setSelectedId(null)
  }

  /** Adds a sticker centered on the canvas at a reasonable default size, preloading its image
   *  so render() can draw it onto canvas without an async wait at bake time. */
  async function handleAddSticker(src: string) {
    const img = await loadImage(src)
    stickerImagesRef.current.set(src, img)
    const size = Math.min(displayWidth, displayHeight) * 0.25
    const shape: ImageShape = {
      id: nextShapeId(),
      type: 'image',
      x: displayWidth / 2 - size / 2,
      y: displayHeight / 2 - size / 2,
      width: size,
      height: size,
      src,
      color: '',
      strokeWidth: 0,
      rotation: 0,
    }
    setShapes((prev) => [...prev, shape])
    setSelectedId(shape.id)
    setTool('select')
    setShowStickerPicker(false)
  }

  function handleStickerFile(file: File | undefined | null) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => void handleAddSticker(reader.result as string)
    reader.readAsDataURL(file)
  }

  /** Bakes rotation, brightness/contrast, shapes, and the crop into one flat raster image. */
  function render(): string {
    const img = imgEl!
    const canvas = document.createElement('canvas')
    canvas.width = cropRect ? Math.round(cropRect.width) : displayWidth
    canvas.height = cropRect ? Math.round(cropRect.height) : displayHeight
    const ctx = canvas.getContext('2d')!
    ctx.filter = composeFilter(filterPreset.filter, brightness, contrast)

    const offsetX = cropRect ? -cropRect.x : 0
    const offsetY = cropRect ? -cropRect.y : 0

    ctx.save()
    ctx.translate(offsetX, offsetY)
    ctx.translate(displayWidth / 2, displayHeight / 2)
    ctx.rotate((rotation * Math.PI) / 180)
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2)
    ctx.restore()

    ctx.filter = 'none'
    ctx.save()
    ctx.translate(offsetX, offsetY)
    for (const shape of shapes) drawShapeOnCanvas(ctx, shape, stickerImagesRef.current)
    ctx.restore()

    return canvas.toDataURL('image/png')
  }

  const selectedShape = shapes.find((s) => s.id === selectedId) ?? null

  return (
    <Modal title="Edit image" onClose={onClose} widthClassName="max-w-5xl">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <ToolButton icon={MousePointer2} active={tool === 'select'} label="Select" onClick={() => setTool('select')} />
          <ToolButton icon={CropIcon} active={tool === 'crop'} label="Crop" onClick={() => setTool('crop')} />
          <ToolButton icon={Square} active={tool === 'rect'} label="Rectangle" onClick={() => setTool('rect')} />
          <ToolButton icon={Circle} active={tool === 'ellipse'} label="Ellipse" onClick={() => setTool('ellipse')} />
          <ToolButton icon={Minus} active={tool === 'line'} label="Line" onClick={() => setTool('line')} />
          <ToolButton icon={Pencil} active={tool === 'draw'} label="Draw" onClick={() => setTool('draw')} />
          <ToolButton icon={Type} active={tool === 'text'} label="Text" onClick={() => setTool('text')} />
          <ToolButton icon={Eraser} active={tool === 'eraser'} label="Eraser" onClick={() => setTool('eraser')} />

          <div className="mx-1 h-6 w-px bg-neutral-70" />

          <button
            type="button"
            title="Rotate left 90°"
            onClick={() => setRotation((r) => normalizeRotation(r - 90))}
            className="rounded-md border border-neutral-70 bg-input p-2 text-neutral-30 hover:bg-neutral-80 hover:text-neutral-5"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Rotate right 90°"
            onClick={() => setRotation((r) => normalizeRotation(r + 90))}
            className="rounded-md border border-neutral-70 bg-input p-2 text-neutral-30 hover:bg-neutral-80 hover:text-neutral-5"
          >
            <RotateCw className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Fine rotation"
            aria-label="Fine rotation"
            onClick={() => setShowRotationSlider((v) => !v)}
            className={`rounded-md border px-2 py-2 text-xs font-mono transition-colors ${
              showRotationSlider || rotation % 90 !== 0
                ? 'border-brand-green-text bg-brand-green/10 text-brand-green-text'
                : 'border-neutral-70 bg-input text-neutral-30 hover:bg-neutral-80 hover:text-neutral-5'
            }`}
          >
            {rotation}°
          </button>

          <button
            type="button"
            title="Brightness & contrast"
            aria-label="Brightness & contrast"
            onClick={() => setShowAdjustments((v) => !v)}
            className={`rounded-md border p-2 transition-colors ${
              showAdjustments || brightness !== 100 || contrast !== 100
                ? 'border-brand-green-text bg-brand-green/10 text-brand-green-text'
                : 'border-neutral-70 bg-input text-neutral-30 hover:bg-neutral-80 hover:text-neutral-5'
            }`}
          >
            <SunMedium className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Filters"
            aria-label="Filters"
            onClick={() => setShowFilters((v) => !v)}
            className={`rounded-md border p-2 transition-colors ${
              showFilters || filterPreset.label !== 'Original'
                ? 'border-brand-green-text bg-brand-green/10 text-brand-green-text'
                : 'border-neutral-70 bg-input text-neutral-30 hover:bg-neutral-80 hover:text-neutral-5'
            }`}
          >
            <Sparkles className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Add sticker"
            aria-label="Add sticker"
            onClick={() => setShowStickerPicker((v) => !v)}
            className={`rounded-md border p-2 transition-colors ${
              showStickerPicker
                ? 'border-brand-green-text bg-brand-green/10 text-brand-green-text'
                : 'border-neutral-70 bg-input text-neutral-30 hover:bg-neutral-80 hover:text-neutral-5'
            }`}
          >
            <ImagePlus className="h-4 w-4" />
          </button>

          {selectedShape && (
            <button
              type="button"
              title="Delete selected"
              onClick={handleDeleteSelected}
              className="rounded-md border border-neutral-70 bg-input p-2 text-brand-destructive hover:bg-neutral-80"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>

        {(tool === 'rect' || tool === 'ellipse' || tool === 'line' || tool === 'draw' || tool === 'text') && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  aria-label={c}
                  style={{ backgroundColor: c }}
                  className={`h-6 w-6 rounded-full border-2 ${color === c ? 'border-brand-green-text' : 'border-neutral-70'}`}
                />
              ))}
            </div>
            <div className="flex flex-1 items-center gap-2">
              <span className="text-xs whitespace-nowrap text-neutral-20">Stroke</span>
              <input
                type="range"
                min={1}
                max={20}
                value={strokeWidth}
                onChange={(e) => setStrokeWidth(Number(e.target.value))}
                className="w-full accent-brand-green"
              />
            </div>
          </div>
        )}

        {tool === 'crop' && (
          <div className="flex items-center gap-1.5">
            {CROP_ASPECT_OPTIONS.map((opt) => (
              <button
                key={opt.label}
                type="button"
                onClick={() => {
                  setCropAspect(opt.ratio)
                  if (opt.ratio) {
                    const base = cropRect ?? { x: 0, y: 0, width: displayWidth, height: displayHeight }
                    const width = Math.min(base.width || displayWidth * 0.6, displayWidth)
                    const height = Math.min(width / opt.ratio, displayHeight)
                    setCropRect({ x: base.x, y: base.y, width, height })
                  }
                }}
                className={`rounded-md border px-2.5 py-1.5 text-xs font-medium ${
                  cropAspect === opt.ratio ? 'border-brand-green-text bg-brand-green/10 text-brand-green-text' : 'border-neutral-70 bg-input text-neutral-30 hover:bg-neutral-80'
                }`}
              >
                {opt.label}
              </button>
            ))}
            {cropRect && (
              <button
                type="button"
                onClick={() => setCropRect(null)}
                className="rounded-md border border-neutral-70 bg-input px-2.5 py-1.5 text-xs font-medium text-neutral-30 hover:bg-neutral-80"
              >
                Clear crop
              </button>
            )}
          </div>
        )}

        {showRotationSlider && (
          <div className="rounded-md border border-neutral-70 bg-input p-3">
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-xs font-medium text-neutral-20">Rotation</label>
              <span className="font-mono text-xs text-neutral-40">{rotation}°</span>
            </div>
            <input
              type="range"
              min={-180}
              max={180}
              value={rotation}
              onChange={(e) => setRotation(Number(e.target.value))}
              className="w-full accent-brand-green"
            />
          </div>
        )}

        {showAdjustments && (
          <div className="grid grid-cols-1 gap-3 rounded-md border border-neutral-70 bg-input p-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-neutral-20">Brightness</label>
              <input
                type="range"
                min={40}
                max={160}
                value={brightness}
                onChange={(e) => setBrightness(Number(e.target.value))}
                className="w-full accent-brand-green"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-neutral-20">Contrast</label>
              <input
                type="range"
                min={40}
                max={160}
                value={contrast}
                onChange={(e) => setContrast(Number(e.target.value))}
                className="w-full accent-brand-green"
              />
            </div>
          </div>
        )}

        {showFilters && (
          <div className="flex gap-2 overflow-x-auto rounded-md border border-neutral-70 bg-input p-3">
            {FILTER_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => setFilterPreset(preset)}
                className="flex shrink-0 flex-col items-center gap-1.5"
              >
                <span
                  className={`h-14 w-14 overflow-hidden rounded-md border-2 bg-cover bg-center ${
                    filterPreset.label === preset.label ? 'border-brand-green-text' : 'border-neutral-70'
                  }`}
                  style={{ backgroundImage: `url(${image})`, filter: preset.filter || 'none' }}
                />
                <span
                  className={`text-[11px] ${
                    filterPreset.label === preset.label ? 'font-medium text-brand-green-text' : 'text-neutral-30'
                  }`}
                >
                  {preset.label}
                </span>
              </button>
            ))}
          </div>
        )}

        {showStickerPicker && (
          <div className="rounded-md border border-neutral-70 bg-input p-3">
            <div className="mb-2 flex flex-wrap gap-2">
              {BUILTIN_STICKERS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => void handleAddSticker(emojiToDataUri(emoji))}
                  className="flex h-10 w-10 items-center justify-center rounded-md border border-neutral-70 bg-card text-xl hover:border-brand-green-text hover:bg-brand-green/5"
                >
                  {emoji}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => stickerFileInputRef.current?.click()}
              className="flex items-center gap-1.5 rounded-md border border-dashed border-neutral-70 px-3 py-2 text-xs font-medium text-neutral-30 hover:bg-neutral-80 hover:text-neutral-5"
            >
              <ImagePlus className="h-3.5 w-3.5" />
              Upload your own sticker
            </button>
            <input
              ref={stickerFileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                handleStickerFile(e.target.files?.[0])
                e.target.value = ''
              }}
            />
            <p className="mt-2 text-xs text-neutral-40">
              Drag a corner handle to resize, the green dot above it to rotate, or the sticker
              itself to move it. Select it and use the Delete button in the toolbar to remove it.
            </p>
          </div>
        )}

        <div className="relative flex items-center justify-center overflow-auto rounded-md border border-neutral-70 bg-black p-2">
          {(filterPreset.label !== 'Original' || brightness !== 100 || contrast !== 100) && (
            <button
              type="button"
              title="Press and hold to compare with the original"
              aria-label="Press and hold to compare with the original"
              onPointerDown={() => setShowOriginal(true)}
              onPointerUp={() => setShowOriginal(false)}
              onPointerLeave={() => setShowOriginal(false)}
              onContextMenu={(e) => e.preventDefault()}
              className="absolute right-4 top-4 z-10 flex items-center gap-1.5 rounded-md bg-neutral-100/70 px-2.5 py-1.5 text-xs font-medium text-neutral-5 backdrop-blur transition-colors select-none hover:bg-neutral-100/90 active:bg-brand-green/80 active:text-on-brand"
              style={{ touchAction: 'none' }}
            >
              <EyeOff className="h-3.5 w-3.5" />
              {showOriginal ? 'Original' : 'Hold to compare'}
            </button>
          )}
          <svg
            ref={svgRef}
            viewBox={`0 0 ${displayWidth} ${displayHeight}`}
            className="max-h-[55vh] w-full touch-none"
            style={{ filter: showOriginal ? 'none' : composeFilter(filterPreset.filter, brightness, contrast) }}
            onPointerDown={handleSurfacePointerDown}
            onPointerMove={handleSurfacePointerMove}
            onPointerUp={handleSurfacePointerUp}
            onPointerLeave={handleSurfacePointerUp}
          >
            <image
              href={image}
              width={imgEl.naturalWidth}
              height={imgEl.naturalHeight}
              transform={`translate(${displayWidth / 2} ${displayHeight / 2}) rotate(${rotation}) translate(${-imgEl.naturalWidth / 2} ${-imgEl.naturalHeight / 2})`}
            />
            <g style={{ filter: 'none' }}>
              {shapes.map((shape) => (
                <ShapeElement
                  key={shape.id}
                  shape={shape}
                  selected={shape.id === selectedId}
                  onSelect={() => tool === 'select' && setSelectedId(shape.id)}
                  onStartResize={
                    shape.type === 'image' ? (handle, e) => handleStartResize(shape, handle, e) : undefined
                  }
                  onStartRotate={shape.type === 'image' ? (e) => handleStartRotate(shape, e) : undefined}
                />
              ))}
              {tool === 'select' && selectedShape && isResizableShape(selectedShape) && selectedShape.type !== 'image' && (
                <ResizeHandles rect={boundsOf(selectedShape)} />
              )}
            </g>
            {cropRect && <CropOverlay rect={cropRect} canvasWidth={displayWidth} canvasHeight={displayHeight} />}
          </svg>
        </div>

        {editingText && (
          <div className="flex items-center gap-2 rounded-md border border-neutral-70 bg-input p-2">
            <input
              autoFocus
              type="text"
              value={textDraft}
              onChange={(e) => setTextDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleConfirmText()
                if (e.key === 'Escape') {
                  setEditingText(null)
                  setTextDraft('')
                }
              }}
              placeholder="Type annotation text…"
              className="flex-1 rounded-md border border-neutral-70 bg-card px-2.5 py-1.5 text-sm text-neutral-5 outline-none focus:border-brand-green-text"
            />
            <button
              type="button"
              onClick={handleConfirmText}
              className="rounded-md bg-brand-green px-3 py-1.5 text-xs font-semibold text-on-brand hover:bg-brand-green-mid"
            >
              Add
            </button>
          </div>
        )}

        <div className="flex flex-wrap justify-end gap-2 border-t border-neutral-70 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-neutral-70 bg-input px-4 py-2 text-sm font-medium text-neutral-30 hover:bg-neutral-80 hover:text-neutral-5"
          >
            Cancel
          </button>
          {onSendToUpscale && (
            <button
              type="button"
              onClick={() => onSendToUpscale(render())}
              className="flex items-center gap-1.5 rounded-md border border-neutral-70 bg-input px-4 py-2 text-sm font-medium text-neutral-30 hover:bg-neutral-80 hover:text-neutral-5"
            >
              <ArrowUpToLine className="h-4 w-4" />
              Upscale
            </button>
          )}
          {onSendToRemoveBackground && (
            <button
              type="button"
              onClick={() => onSendToRemoveBackground(render())}
              className="flex items-center gap-1.5 rounded-md border border-neutral-70 bg-input px-4 py-2 text-sm font-medium text-neutral-30 hover:bg-neutral-80 hover:text-neutral-5"
            >
              <Eraser className="h-4 w-4" />
              Remove background
            </button>
          )}
          {onUseAsInput && (
            <button
              type="button"
              onClick={() => onUseAsInput(render())}
              className="flex items-center gap-1.5 rounded-md border border-neutral-70 bg-input px-4 py-2 text-sm font-medium text-neutral-30 hover:bg-neutral-80 hover:text-neutral-5"
            >
              <ImageDown className="h-4 w-4" />
              Use as input image
            </button>
          )}
          {onSaveAsCopy && (
            <button
              type="button"
              onClick={() => onSaveAsCopy(render())}
              className="flex items-center gap-1.5 rounded-md border border-neutral-70 bg-input px-4 py-2 text-sm font-medium text-neutral-30 hover:bg-neutral-80 hover:text-neutral-5"
            >
              <FolderPlus className="h-4 w-4" />
              Save to My Media
            </button>
          )}
          {onDownload && (
            <button
              type="button"
              onClick={() => onDownload(render())}
              className="flex items-center gap-1.5 rounded-md bg-brand-green px-4 py-2 text-sm font-semibold text-on-brand hover:bg-brand-green-mid"
            >
              <Download className="h-4 w-4" />
              Download
            </button>
          )}
          {onSave && (
            <button
              type="button"
              onClick={() => onSave(render())}
              className="flex items-center gap-1.5 rounded-md bg-brand-green px-4 py-2 text-sm font-semibold text-on-brand hover:bg-brand-green-mid"
            >
              <Check className="h-4 w-4" />
              Save
            </button>
          )}
        </div>
        <p className="text-center text-xs text-neutral-50">{suggestedName}</p>
      </div>
    </Modal>
  )
}

function ToolButton({
  icon: Icon,
  active,
  label,
  onClick,
}: {
  icon: typeof MousePointer2
  active: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={`rounded-md border p-2 transition-colors ${
        active ? 'border-brand-green-text bg-brand-green/10 text-brand-green-text' : 'border-neutral-70 bg-input text-neutral-30 hover:bg-neutral-80 hover:text-neutral-5'
      }`}
    >
      <Icon className="h-4 w-4" />
    </button>
  )
}

function ShapeElement({
  shape,
  selected,
  onSelect,
  onStartResize,
  onStartRotate,
}: {
  shape: Shape
  selected: boolean
  onSelect: () => void
  onStartResize?: (handle: string, e: React.PointerEvent) => void
  onStartRotate?: (e: React.PointerEvent) => void
}) {
  const common = { onClick: onSelect, style: { cursor: 'pointer' } }
  if (shape.type === 'image') {
    const b = boundsOf(shape)
    const cx = b.x + b.width / 2
    const cy = b.y + b.height / 2
    const rotateCx = cx
    const rotateCy = b.y - ROTATE_HANDLE_OFFSET
    return (
      <g transform={`rotate(${shape.rotation} ${cx} ${cy})`}>
        <image {...common} href={shape.src} x={b.x} y={b.y} width={b.width} height={b.height} preserveAspectRatio="none" />
        {selected && (
          <>
            <rect x={b.x} y={b.y} width={b.width} height={b.height} fill="none" stroke="#afff9f" strokeWidth={1.5} strokeDasharray="6 3" style={{ pointerEvents: 'none' }} />
            <line x1={cx} y1={b.y} x2={rotateCx} y2={rotateCy} stroke="#afff9f" strokeWidth={1.5} style={{ pointerEvents: 'none' }} />
            <circle
              cx={rotateCx}
              cy={rotateCy}
              r={ROTATE_HANDLE_RADIUS}
              fill="#afff9f"
              stroke="#1b1b1b"
              strokeWidth={1.5}
              style={{ cursor: 'grab', touchAction: 'none' }}
              onPointerDown={(e) => {
                e.stopPropagation()
                onStartRotate?.(e)
              }}
            />
            {(['tl', 'tr', 'bl', 'br'] as const).map((corner) => {
              const hx = corner.includes('l') ? b.x : b.x + b.width
              const hy = corner.includes('t') ? b.y : b.y + b.height
              const cursor = corner === 'tl' || corner === 'br' ? 'nwse-resize' : 'nesw-resize'
              return (
                <circle
                  key={corner}
                  cx={hx}
                  cy={hy}
                  r={RESIZE_HANDLE_RADIUS}
                  fill="#afff9f"
                  stroke="#1b1b1b"
                  strokeWidth={1.5}
                  style={{ cursor, touchAction: 'none' }}
                  onPointerDown={(e) => {
                    e.stopPropagation()
                    onStartResize?.(corner, e)
                  }}
                />
              )
            })}
          </>
        )}
      </g>
    )
  }
  if (shape.type === 'rect') {
    const b = boundsOf(shape)
    return (
      <rect
        {...common}
        x={b.x}
        y={b.y}
        width={b.width}
        height={b.height}
        fill="none"
        stroke={shape.color}
        strokeWidth={shape.strokeWidth}
        strokeDasharray={selected ? '6 3' : undefined}
      />
    )
  }
  if (shape.type === 'ellipse') {
    const b = boundsOf(shape)
    return (
      <ellipse
        {...common}
        cx={b.x + b.width / 2}
        cy={b.y + b.height / 2}
        rx={b.width / 2}
        ry={b.height / 2}
        fill="none"
        stroke={shape.color}
        strokeWidth={shape.strokeWidth}
        strokeDasharray={selected ? '6 3' : undefined}
      />
    )
  }
  if (shape.type === 'line') {
    return (
      <line
        {...common}
        x1={shape.x1}
        y1={shape.y1}
        x2={shape.x2}
        y2={shape.y2}
        stroke={shape.color}
        strokeWidth={shape.strokeWidth}
        strokeDasharray={selected ? '6 3' : undefined}
      />
    )
  }
  if (shape.type === 'draw') {
    const d = shape.points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
    return (
      <path
        {...common}
        d={d}
        fill="none"
        stroke={shape.color}
        strokeWidth={shape.strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={selected ? 0.7 : 1}
      />
    )
  }
  return (
    <text {...common} x={shape.x} y={shape.y} fontSize={shape.fontSize} fill={shape.color} opacity={selected ? 0.7 : 1}>
      {shape.text}
    </text>
  )
}

/** Corner drag handles for a selected resizable shape (rect/ellipse/image), matching
 *  CropOverlay's handle styling — dragging one is handled by the 'resize-shape' drag mode. */
function ResizeHandles({ rect }: { rect: { x: number; y: number; width: number; height: number } }) {
  return (
    <>
      {['tl', 'tr', 'bl', 'br'].map((handle) => {
        const hx = handle.includes('l') ? rect.x : rect.x + rect.width
        const hy = handle.includes('t') ? rect.y : rect.y + rect.height
        return <circle key={handle} cx={hx} cy={hy} r={RESIZE_HANDLE_RADIUS} fill="#afff9f" style={{ cursor: 'nwse-resize' }} />
      })}
    </>
  )
}

function CropOverlay({
  rect,
  canvasWidth,
  canvasHeight,
}: {
  rect: { x: number; y: number; width: number; height: number }
  canvasWidth: number
  canvasHeight: number
}) {
  return (
    <>
      <path
        d={`M0 0 H${canvasWidth} V${canvasHeight} H0 Z M${rect.x} ${rect.y} H${rect.x + rect.width} V${rect.y + rect.height} H${rect.x} Z`}
        fill="black"
        fillOpacity={0.5}
        fillRule="evenodd"
        style={{ pointerEvents: 'none' }}
      />
      <rect x={rect.x} y={rect.y} width={rect.width} height={rect.height} fill="none" stroke="#afff9f" strokeWidth={2} style={{ pointerEvents: 'none' }} />
      {['tl', 'tr', 'bl', 'br'].map((handle) => {
        const hx = handle.includes('l') ? rect.x : rect.x + rect.width
        const hy = handle.includes('t') ? rect.y : rect.y + rect.height
        return <circle key={handle} cx={hx} cy={hy} r={RESIZE_HANDLE_RADIUS} fill="#afff9f" style={{ pointerEvents: 'none' }} />
      })}
    </>
  )
}

function pointInRect(point: { x: number; y: number }, rect: { x: number; y: number; width: number; height: number }): boolean {
  return point.x >= rect.x && point.x <= rect.x + rect.width && point.y >= rect.y && point.y <= rect.y + rect.height
}

function hitTestCropHandle(
  point: { x: number; y: number },
  rect: { x: number; y: number; width: number; height: number },
): string | null {
  const handles: Record<string, { x: number; y: number }> = {
    tl: { x: rect.x, y: rect.y },
    tr: { x: rect.x + rect.width, y: rect.y },
    bl: { x: rect.x, y: rect.y + rect.height },
    br: { x: rect.x + rect.width, y: rect.y + rect.height },
  }
  for (const [name, pos] of Object.entries(handles)) {
    if (Math.hypot(point.x - pos.x, point.y - pos.y) <= RESIZE_HANDLE_RADIUS + 10) return name
  }
  return null
}

// Shared with ShapeElement's/CropOverlay's/ResizeHandles' rendering of these same handles, so
// hit-testing always matches what's actually drawn on screen.
const RESIZE_HANDLE_RADIUS = 13
const ROTATE_HANDLE_OFFSET = 36
const ROTATE_HANDLE_RADIUS = 18

function resizeCrop(
  origin: { x: number; y: number; width: number; height: number },
  handle: string,
  point: { x: number; y: number },
  aspect: number | null,
  maxWidth: number,
  maxHeight: number,
): { x: number; y: number; width: number; height: number } {
  const fixedX = handle.includes('l') ? origin.x + origin.width : origin.x
  const fixedY = handle.includes('t') ? origin.y + origin.height : origin.y

  let width = point.x - fixedX
  let height = point.y - fixedY

  if (aspect) {
    const sign = (v: number) => (v < 0 ? -1 : 1)
    if (Math.abs(width) / aspect > Math.abs(height)) height = sign(height || 1) * (Math.abs(width) / aspect)
    else width = sign(width || 1) * Math.abs(height) * aspect
  }

  let x = Math.min(fixedX, fixedX + width)
  let y = Math.min(fixedY, fixedY + height)
  let w = Math.abs(width)
  let h = Math.abs(height)

  x = Math.max(0, x)
  y = Math.max(0, y)
  w = Math.min(w, maxWidth - x)
  h = Math.min(h, maxHeight - y)

  return { x, y, width: w, height: h }
}

function drawShapeOnCanvas(
  ctx: CanvasRenderingContext2D,
  shape: Shape,
  stickerImages: Map<string, HTMLImageElement>,
) {
  ctx.strokeStyle = shape.color
  ctx.fillStyle = shape.color
  ctx.lineWidth = shape.strokeWidth
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  if (shape.type === 'image') {
    const img = stickerImages.get(shape.src)
    if (img) {
      const b = boundsOf(shape)
      const cx = b.x + b.width / 2
      const cy = b.y + b.height / 2
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate((shape.rotation * Math.PI) / 180)
      ctx.drawImage(img, -b.width / 2, -b.height / 2, b.width, b.height)
      ctx.restore()
    }
  } else if (shape.type === 'rect') {
    const b = boundsOf(shape)
    ctx.strokeRect(b.x, b.y, b.width, b.height)
  } else if (shape.type === 'ellipse') {
    const b = boundsOf(shape)
    ctx.beginPath()
    ctx.ellipse(b.x + b.width / 2, b.y + b.height / 2, b.width / 2, b.height / 2, 0, 0, Math.PI * 2)
    ctx.stroke()
  } else if (shape.type === 'line') {
    ctx.beginPath()
    ctx.moveTo(shape.x1, shape.y1)
    ctx.lineTo(shape.x2, shape.y2)
    ctx.stroke()
  } else if (shape.type === 'draw') {
    if (shape.points.length < 2) return
    ctx.beginPath()
    ctx.moveTo(shape.points[0].x, shape.points[0].y)
    for (const p of shape.points.slice(1)) ctx.lineTo(p.x, p.y)
    ctx.stroke()
  } else if (shape.type === 'text') {
    ctx.font = `${shape.fontSize}px sans-serif`
    ctx.fillText(shape.text, shape.x, shape.y)
  }
}
