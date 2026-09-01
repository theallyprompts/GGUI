import type { AspectRatioOption } from '../../../lib/models'

interface AspectRatioIconProps {
  shape: AspectRatioOption['icon']
  active?: boolean
}

const DIMENSIONS: Record<AspectRatioIconProps['shape'], { w: number; h: number }> = {
  'portrait-tall': { w: 7, h: 14 },
  portrait: { w: 9.5, h: 14 },
  square: { w: 12, h: 12 },
  landscape: { w: 14, h: 9.5 },
  'landscape-wide': { w: 14, h: 7 },
}

export function AspectRatioIcon({ shape, active }: AspectRatioIconProps) {
  const { w, h } = DIMENSIONS[shape]
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" className="shrink-0">
      <rect
        x={(16 - w) / 2}
        y={(16 - h) / 2}
        width={w}
        height={h}
        rx="1.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className={active ? 'text-brand-green-text' : 'text-neutral-40'}
      />
    </svg>
  )
}
