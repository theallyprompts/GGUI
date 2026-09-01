import { useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Wand2 } from 'lucide-react'

export interface ImageActionsMenuItem {
  label: string
  onSelect: () => void
  icon?: React.ReactNode
  destructive?: boolean
}

interface ImageActionsMenuProps {
  items: ImageActionsMenuItem[]
}

interface MenuPosition {
  left: number
  // Exactly one of these is set, matching whichever edge the menu should anchor to.
  top?: number
  bottom?: number
}

/** Keeps item order stable except for sinking any destructive (e.g. Delete) items to the end,
 *  so a menu's danger action is always last regardless of how callers order their item list. */
function sortWithDestructiveLast(items: ImageActionsMenuItem[]): ImageActionsMenuItem[] {
  const nonDestructive = items.filter((item) => !item.destructive)
  const destructive = items.filter((item) => item.destructive)
  return [...nonDestructive, ...destructive]
}

export function ImageActionsMenu({ items }: ImageActionsMenuProps) {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState<MenuPosition | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return
    const buttonRect = buttonRef.current.getBoundingClientRect()
    // Provisionally anchor above the button; corrected below once the menu's real height is known.
    setPosition({ left: buttonRect.left, bottom: window.innerHeight - buttonRect.top + 4 })
  }, [open])

  useLayoutEffect(() => {
    // Only the provisional upward placement (position.bottom set) needs correcting — once flipped
    // to downward (position.top set), re-running this on every position change would loop forever
    // since the flip condition stays true (the button's position hasn't moved).
    if (!open || !menuRef.current || !buttonRef.current || !position || position.top !== undefined) return
    const menuRect = menuRef.current.getBoundingClientRect()
    const buttonRect = buttonRef.current.getBoundingClientRect()
    // If opening upward would clip above the viewport, flip to downward instead.
    if (buttonRect.top - menuRect.height < 0) {
      setPosition({ left: buttonRect.left, top: buttonRect.bottom + 4 })
    }
  }, [open, position])

  useLayoutEffect(() => {
    if (!open) return
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node
      if (buttonRef.current?.contains(target)) return
      if (menuRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <>
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation()
          setOpen((v) => !v)
        }}
        title="Actions"
        className="absolute bottom-2 left-2 z-10 flex h-7 w-7 items-center justify-center rounded-md border border-neutral-50 bg-neutral-100/80 text-neutral-5 backdrop-blur hover:bg-neutral-100/95"
      >
        <Wand2 className="h-4 w-4" strokeWidth={1.75} />
      </button>

      {open &&
        position &&
        createPortal(
          <div
            ref={menuRef}
            onClick={(e) => e.stopPropagation()}
            style={{ position: 'fixed', left: position.left, top: position.top, bottom: position.bottom }}
            className="z-50 w-max min-w-[140px] overflow-hidden rounded-md border border-neutral-70 bg-card shadow-xl"
          >
            {sortWithDestructiveLast(items).map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  item.onSelect()
                  setOpen(false)
                }}
                className={`flex w-full items-center gap-2 whitespace-nowrap px-3 py-2 text-left text-sm hover:bg-neutral-80 ${
                  item.destructive ? 'text-brand-destructive' : 'text-neutral-20'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </>
  )
}
