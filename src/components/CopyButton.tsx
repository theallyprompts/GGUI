import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

interface CopyButtonProps {
  text: string
  label?: string
  className?: string
  iconClassName?: string
}

/** A small icon button that copies `text` to the clipboard, swapping to a checkmark for ~1.5s
 *  as feedback — matches the existing "Copy UUID" pattern in Manage Media. Stops propagation so
 *  it can sit inside a larger clickable card without triggering the card's own click handler. */
export function CopyButton({ text, label = 'Copy', className, iconClassName = 'h-3.5 w-3.5' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy(e: React.MouseEvent) {
    e.stopPropagation()
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard access denied or unavailable — nothing more we can do.
    }
  }

  return (
    <button
      type="button"
      onClick={(e) => void handleCopy(e)}
      disabled={!text}
      aria-label={label}
      title={label}
      className={
        className ?? 'rounded-md p-1.5 text-neutral-40 hover:bg-neutral-80 hover:text-neutral-5 disabled:cursor-not-allowed disabled:opacity-40'
      }
    >
      {copied ? <Check className={`${iconClassName} text-brand-green-text`} /> : <Copy className={iconClassName} />}
    </button>
  )
}
