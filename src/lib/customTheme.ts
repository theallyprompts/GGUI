/** User-overridable cosmetic theme — a single accent hue plus the core surface colors. Every
 *  other CSS variable (neutral ramp, on-brand text, etc.) stays exactly as defined in index.css
 *  so contrast/readability is never at risk — only the accent and surfaces can be recolored. */
export interface CustomThemeOverrides {
  /** The base accent color the user picked — brand-green-mid/-deep/-text are all derived from
   *  this at fixed lightness/saturation offsets, matching the built-in green's own ramp. */
  accent: string
  bg: string
  card: string
  border: string
  input: string
}

const STORAGE_KEY = 'runware-generator:custom-theme'

const ACCENT_VARS = ['--color-brand-green', '--color-brand-green-mid', '--color-brand-green-deep'] as const
const SURFACE_VARS = ['--color-bg', '--color-card', '--color-border', '--color-input'] as const
/** Overridden per-theme rather than globally — light mode needs a darker/more saturated accent
 *  for text/border legibility (see index.css), so this is derived and applied on top of whichever
 *  theme is currently active instead of being a fixed override. */
const ACCENT_TEXT_VAR = '--color-brand-green-text'

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      case b:
        h = (r - g) / d + 4
        break
    }
    h /= 6
  }
  return [h * 360, s * 100, l * 100]
}

function hslToHex(h: number, s: number, l: number): string {
  const sNorm = s / 100
  const lNorm = l / 100
  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = lNorm - c / 2
  let [r, g, b] = [0, 0, 0]
  if (h < 60) [r, g, b] = [c, x, 0]
  else if (h < 120) [r, g, b] = [x, c, 0]
  else if (h < 180) [r, g, b] = [0, c, x]
  else if (h < 240) [r, g, b] = [0, x, c]
  else if (h < 300) [r, g, b] = [x, 0, c]
  else [r, g, b] = [c, 0, x]
  const toHex = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

/** Derives the full accent ramp from one picked color, matching the built-in green's own
 *  lightness/saturation steps at the same hue (see the comment above ACCENT_VARS). */
function deriveAccentRamp(accentHex: string): {
  base: string
  mid: string
  deep: string
  textLight: string
} {
  const [h] = hexToHsl(accentHex)
  return {
    base: accentHex,
    mid: hslToHex(h, 88, 73),
    deep: hslToHex(h, 34, 27),
    textLight: hslToHex(h, 59, 30),
  }
}

function applyOverrides(overrides: CustomThemeOverrides): void {
  const root = document.documentElement
  const ramp = deriveAccentRamp(overrides.accent)
  root.style.setProperty(ACCENT_VARS[0], ramp.base)
  root.style.setProperty(ACCENT_VARS[1], ramp.mid)
  root.style.setProperty(ACCENT_VARS[2], ramp.deep)
  root.style.setProperty(
    ACCENT_TEXT_VAR,
    root.getAttribute('data-theme') === 'light' ? ramp.textLight : ramp.base,
  )
  root.style.setProperty('--color-bg', overrides.bg)
  root.style.setProperty('--color-card', overrides.card)
  root.style.setProperty('--color-border', overrides.border)
  root.style.setProperty('--color-input', overrides.input)
}

function clearOverrides(): void {
  const root = document.documentElement
  for (const v of [...ACCENT_VARS, ACCENT_TEXT_VAR, ...SURFACE_VARS]) root.style.removeProperty(v)
}

/** Re-applies the accent-text derivation when the light/dark theme flips, so a custom accent
 *  stays legible as text in light mode without needing its own stored light/dark pair. */
export function reapplyCustomThemeForCurrentMode(): void {
  const overrides = loadCustomTheme()
  if (overrides) applyOverrides(overrides)
}

export function loadCustomTheme(): CustomThemeOverrides | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<CustomThemeOverrides>
    if (!parsed.accent || !parsed.bg || !parsed.card || !parsed.border || !parsed.input) return null
    return parsed as CustomThemeOverrides
  } catch {
    return null
  }
}

export function saveCustomTheme(overrides: CustomThemeOverrides): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides))
  applyOverrides(overrides)
}

export function resetCustomTheme(): void {
  localStorage.removeItem(STORAGE_KEY)
  clearOverrides()
}

/** Applies whatever's persisted at startup — a no-op if the user never customized. */
export function initCustomTheme(): void {
  const overrides = loadCustomTheme()
  if (overrides) applyOverrides(overrides)
}

export function exportCustomThemeCss(overrides: CustomThemeOverrides): string {
  const ramp = deriveAccentRamp(overrides.accent)
  return `/* Runware Generator custom theme — import this file back in Settings > Visual to restore it. */
:root {
  --color-brand-green: ${ramp.base};
  --color-brand-green-mid: ${ramp.mid};
  --color-brand-green-deep: ${ramp.deep};
  --color-brand-green-text: ${ramp.base};
  --color-bg: ${overrides.bg};
  --color-card: ${overrides.card};
  --color-border: ${overrides.border};
  --color-input: ${overrides.input};
}
`
}

const CSS_VAR_PATTERN = /--color-([\w-]+):\s*(#[0-9a-fA-F]{6})\s*;/g

/** Parses a previously-exported (or hand-edited) theme CSS file back into overrides. Returns
 *  null if it doesn't contain the variables this app looks for. */
export function parseCustomThemeCss(css: string): CustomThemeOverrides | null {
  const vars: Record<string, string> = {}
  for (const m of css.matchAll(CSS_VAR_PATTERN)) {
    vars[m[1]] = m[2]
  }
  const accent = vars['brand-green']
  const bg = vars['bg']
  const card = vars['card']
  const border = vars['border']
  const input = vars['input']
  if (!accent || !bg || !card || !border || !input) return null
  return { accent, bg, card, border, input }
}
