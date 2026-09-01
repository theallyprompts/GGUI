import { useRef, useState } from 'react'
import { BookText } from 'lucide-react'
import { usePromptStudioStore, type PromptStudioEntry } from '../store/promptStudio.store'
import { findEmphasisGroups, stepEmphasisAt } from '../lib/promptEmphasis'
import type { Ecosystem } from '../lib/models'
import { PromptStudioPickerModal } from './PromptStudioPickerModal'

interface PromptTextFieldProps {
  label: string
  required?: boolean
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
  field: 'positive' | 'negative'
  activeEcosystem?: Ecosystem
}

/** Splices `insertion` into `text` at [start, end), matching the standard "replace the current
 *  selection" behavior of a real cursor insert. Returns the new text and where the cursor should
 *  land afterward (right after the inserted text). */
function insertAt(
  text: string,
  insertion: string,
  start: number,
  end: number,
): { text: string; cursor: number } {
  // A textarea's value is usually non-empty already at this point (there's normally at least a
  // partial prompt), so pad with a separating comma/space unless inserting at the very start or
  // right after existing whitespace/punctuation.
  const before = text.slice(0, start)
  const after = text.slice(end)
  const needsLeadingSeparator = before.length > 0 && !/[\s,]$/.test(before)
  const separator = needsLeadingSeparator ? ', ' : ''
  const combined = before + separator + insertion
  return { text: combined + after, cursor: combined.length }
}

/**
 * Renders `text` with every `(word:1.5)`/`(word)` emphasis group visually highlighted, as a
 * same-box-model overlay sitting behind a transparent-text textarea (see PromptTextField) — a
 * plain <textarea> can't style inline substrings itself, so this is the standard
 * highlight-behind-a-transparent-input technique. Must stay pixel-identical to the textarea in
 * font/padding/border/whitespace handling or the highlights drift out of alignment with the
 * real text as it wraps.
 */
function EmphasisOverlay({ text }: { text: string }) {
  const groups = findEmphasisGroups(text)
  const nodes: React.ReactNode[] = []
  let cursor = 0
  groups.forEach((g, i) => {
    if (g.start > cursor) nodes.push(text.slice(cursor, g.start))
    const intensity = Math.min(1, Math.abs(g.weight - 1))
    const color = g.weight >= 1 ? 'rgba(175, 255, 159, OPACITY)' : 'rgba(255, 125, 125, OPACITY)'
    nodes.push(
      <span
        key={i}
        style={{ backgroundColor: color.replace('OPACITY', String(0.15 + intensity * 0.35)) }}
        className="rounded-sm"
      >
        {text.slice(g.start, g.end)}
      </span>,
    )
    cursor = g.end
  })
  if (cursor < text.length) nodes.push(text.slice(cursor))
  // A trailing newline needs a trailing zero-width space or the wrapped <div> collapses it,
  // which would desync the overlay's height from the textarea's.
  return (
    <div
      aria-hidden
      className="prompt-emphasis-overlay pointer-events-none absolute inset-0 overflow-auto whitespace-pre-wrap break-words px-3 py-2 text-sm text-transparent"
      style={{ scrollbarWidth: 'none' }}
    >
      {nodes}
      {text.endsWith('\n') ? '​' : null}
    </div>
  )
}

export function PromptTextField({
  label,
  required,
  value,
  onChange,
  placeholder,
  rows = 4,
  field,
  activeEcosystem,
}: PromptTextFieldProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [showPicker, setShowPicker] = useState(false)
  const markUsed = usePromptStudioStore((s) => s.markUsed)

  function handleSelect(entry: PromptStudioEntry) {
    const text = field === 'negative' && entry.negativeText ? entry.negativeText : entry.positiveText

    if (entry.kind === 'full') {
      onChange(text)
    } else {
      const el = textareaRef.current
      const start = el?.selectionStart ?? value.length
      const end = el?.selectionEnd ?? value.length
      const { text: newText, cursor } = insertAt(value, text, start, end)
      onChange(newText)
      // Restore focus and cursor position after the controlled value updates.
      requestAnimationFrame(() => {
        el?.focus()
        el?.setSelectionRange(cursor, cursor)
      })
    }
    markUsed(entry.id)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (!e.ctrlKey && !e.metaKey) return
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return
    const el = textareaRef.current
    if (!el) return

    e.preventDefault()
    const direction = e.key === 'ArrowUp' ? 1 : -1
    const result = stepEmphasisAt(value, el.selectionStart, el.selectionEnd, direction)
    if (!result) return

    onChange(result.text)
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(result.cursor, result.cursor)
    })
  }

  function handleScroll(e: React.UIEvent<HTMLTextAreaElement>) {
    const overlay = e.currentTarget.previousElementSibling as HTMLDivElement | null
    if (overlay) {
      overlay.scrollTop = e.currentTarget.scrollTop
      overlay.scrollLeft = e.currentTarget.scrollLeft
    }
  }

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label className="flex items-center gap-1 text-sm font-medium text-neutral-5">
          {label}
          {required && <span className="text-brand-destructive">*</span>}
        </label>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px] text-neutral-50">{value.length} chars</span>
          <button
            type="button"
            onClick={() => setShowPicker(true)}
            className="flex items-center gap-1 text-xs text-brand-green-text hover:underline"
          >
            <BookText className="h-3 w-3" />
            Load from Prompt Studio
          </button>
        </div>
      </div>
      <div className="relative overflow-hidden rounded-md border border-neutral-70 bg-input focus-within:border-brand-green-text">
        <EmphasisOverlay text={value} />
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onScroll={handleScroll}
          placeholder={placeholder}
          rows={rows}
          required={required}
          spellCheck={false}
          title="Ctrl+Up / Ctrl+Down adjusts (word:weight) emphasis on the word or selection at the cursor"
          className="relative w-full resize-none border-0 bg-transparent px-3 py-2 text-sm text-neutral-5 caret-neutral-5 placeholder-neutral-50 outline-none"
        />
      </div>

      {showPicker && (
        <PromptStudioPickerModal
          field={field}
          activeEcosystem={activeEcosystem}
          onClose={() => setShowPicker(false)}
          onSelect={handleSelect}
        />
      )}
    </div>
  )
}
