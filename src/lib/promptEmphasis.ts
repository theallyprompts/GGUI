/** A `(text:weight)` or bare `(text)` emphasis group found in prompt text. `weight` is `1` for
 *  a bare `(text)` group (the implicit default), matching the A1111 convention Runware-side
 *  models generally follow. */
export interface EmphasisMatch {
  start: number
  end: number
  /** The text inside the parens, excluding the `:weight` suffix if present. */
  inner: string
  weight: number
}

const EMPHASIS_PATTERN = /\(([^():]+)(?::([0-9]*\.?[0-9]+))?\)/g

/** Finds every `(word:1.5)`/`(word)` emphasis group in `text`, in order. */
export function findEmphasisGroups(text: string): EmphasisMatch[] {
  const matches: EmphasisMatch[] = []
  for (const m of text.matchAll(EMPHASIS_PATTERN)) {
    if (m.index === undefined) continue
    matches.push({
      start: m.index,
      end: m.index + m[0].length,
      inner: m[1],
      weight: m[2] !== undefined ? Number(m[2]) : 1,
    })
  }
  return matches
}

/** The emphasis group whose parens contain `position` (cursor at or inside the group), or null. */
function groupAt(groups: EmphasisMatch[], position: number): EmphasisMatch | undefined {
  return groups.find((g) => position >= g.start && position <= g.end)
}

/** A bare word/run of non-space, non-comma characters touching `position` — the "word:1.0"
 *  Ctrl+Up would newly wrap if the cursor isn't already inside a parenthesized group. */
function wordAt(text: string, position: number): { start: number; end: number; word: string } | null {
  const isWordChar = (c: string) => c !== undefined && !/[\s,]/.test(c)
  if (!isWordChar(text[position]) && !isWordChar(text[position - 1])) return null

  let start = position
  while (start > 0 && isWordChar(text[start - 1])) start--
  let end = position
  while (end < text.length && isWordChar(text[end])) end++
  if (start === end) return null
  return { start, end, word: text.slice(start, end) }
}

const WEIGHT_STEP = 0.1
const MIN_WEIGHT = 0.1
const MAX_WEIGHT = 2

function clampWeight(weight: number): number {
  return Math.min(MAX_WEIGHT, Math.max(MIN_WEIGHT, weight))
}

function formatWeight(weight: number): string {
  // Avoid float noise like 1.2000000000000002 from repeated +/- 0.1 steps.
  return Number(weight.toFixed(2)).toString()
}

export interface EmphasisStepResult {
  text: string
  /** Where to place the cursor afterward — kept inside the (possibly resized) group. */
  cursor: number
}

/**
 * Steps the emphasis weight of whatever group/word the cursor is at or inside, by `direction`
 * (+1 for Ctrl+Up, -1 for Ctrl+Down) in `WEIGHT_STEP` increments, clamped to
 * [MIN_WEIGHT, MAX_WEIGHT]. If the cursor isn't already inside a `(word:N)` group, wraps the
 * word/selection under the cursor in a new group at 1.0 before applying the step — so the very
 * first Ctrl+Up on a plain word starts it at 1.1 (or 0.9 for Ctrl+Down), matching the common
 * A1111-style editor convention. Returns null if there's no word or selection to act on.
 */
export function stepEmphasisAt(
  text: string,
  selectionStart: number,
  selectionEnd: number,
  direction: 1 | -1,
): EmphasisStepResult | null {
  const groups = findEmphasisGroups(text)
  const existing = groupAt(groups, selectionStart)

  if (existing) {
    const newWeight = clampWeight(existing.weight + direction * WEIGHT_STEP)
    const replacement = `(${existing.inner}:${formatWeight(newWeight)})`
    const newText = text.slice(0, existing.start) + replacement + text.slice(existing.end)
    return { text: newText, cursor: existing.start + replacement.length }
  }

  // No existing group — wrap the current selection, or else the word touching the cursor.
  let start = selectionStart
  let end = selectionEnd
  let inner = text.slice(start, end)
  if (!inner) {
    const word = wordAt(text, selectionStart)
    if (!word) return null
    start = word.start
    end = word.end
    inner = word.word
  }

  const newWeight = clampWeight(1 + direction * WEIGHT_STEP)
  const replacement = `(${inner}:${formatWeight(newWeight)})`
  const newText = text.slice(0, start) + replacement + text.slice(end)
  return { text: newText, cursor: start + replacement.length }
}
