import type { ReactNode } from 'react'
import { Info } from 'lucide-react'

interface TooltipProps {
  text?: string
  children?: ReactNode
  icon?: ReactNode
  width?: string
  placement?: 'top' | 'bottom'
}

export function Tooltip({ text, children, icon, width = 'w-56', placement = 'top' }: TooltipProps) {
  return (
    <span className="group relative inline-flex">
      {icon ?? <Info tabIndex={0} className="h-3 w-3 text-neutral-40 outline-none" />}
      <span
        role="tooltip"
        className={`pointer-events-none absolute left-0 z-10 ${width} rounded-md border border-neutral-70 bg-neutral-90 px-2.5 py-1.5 text-xs font-normal text-neutral-10 opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 ${
          placement === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
        }`}
      >
        {children ?? text}
      </span>
    </span>
  )
}
