import { create } from 'zustand'
import { DEFAULT_MODEL } from '../lib/models'
import {
  type CustomThemeOverrides,
  initCustomTheme,
  loadCustomTheme,
  saveCustomTheme,
  resetCustomTheme as clearCustomTheme,
  reapplyCustomThemeForCurrentMode,
} from '../lib/customTheme'

const STORAGE_KEY = 'runware-generator:preferred-output-format'
const DEFAULT_MODEL_STORAGE_KEY = 'runware-generator:default-model-id'
const SPEND_CAP_STORAGE_KEY = 'runware-generator:spend-cap'
const LOW_BALANCE_FLOOR_STORAGE_KEY = 'runware-generator:low-balance-floor'
const SESSION_SPEND_STORAGE_KEY = 'runware-generator:session-spend'
const THEME_STORAGE_KEY = 'runware-generator:theme'
const HIDE_INTRODUCTION_STORAGE_KEY = 'runware-generator:hide-introduction'

export type Theme = 'dark' | 'light'

function loadTheme(): Theme {
  const stored = localStorage.getItem(THEME_STORAGE_KEY)
  return stored === 'light' ? 'light' : 'dark'
}

function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme)
  reapplyCustomThemeForCurrentMode()
}

applyTheme(loadTheme())
initCustomTheme()

export type PreferredOutputFormat = 'JPG' | 'PNG' | 'WEBP'

function loadPreferredOutputFormat(): PreferredOutputFormat {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'JPG' || stored === 'PNG' || stored === 'WEBP') return stored
  return 'WEBP'
}

function loadDefaultModelId(): string {
  return localStorage.getItem(DEFAULT_MODEL_STORAGE_KEY) ?? DEFAULT_MODEL.id
}

function loadPositiveNumber(key: string): number | null {
  const stored = Number(localStorage.getItem(key))
  return Number.isFinite(stored) && stored > 0 ? stored : null
}

function loadHideIntroduction(): boolean {
  return localStorage.getItem(HIDE_INTRODUCTION_STORAGE_KEY) === 'true'
}

function loadSessionSpend(): number {
  const stored = Number(localStorage.getItem(SESSION_SPEND_STORAGE_KEY))
  return Number.isFinite(stored) && stored >= 0 ? stored : 0
}

interface PreferencesState {
  preferredOutputFormat: PreferredOutputFormat
  setPreferredOutputFormat: (format: PreferredOutputFormat) => void
  defaultModelId: string
  setDefaultModelId: (modelId: string) => void
  theme: Theme
  setTheme: (theme: Theme) => void

  /** User's cosmetic accent/surface color overrides, or null for the built-in Runware green theme. */
  customTheme: CustomThemeOverrides | null
  setCustomTheme: (overrides: CustomThemeOverrides) => void
  resetCustomTheme: () => void

  /** When true, the app skips landing on the Introduction pseudo-model on startup. */
  hideIntroduction: boolean
  setHideIntroduction: (hide: boolean) => void

  /** Dollar limit on `sessionSpend` before the spend-cap popup fires. `null` = disabled. */
  spendCap: number | null
  setSpendCap: (cap: number | null) => void
  /** Dollar floor on the polled account balance before the low-balance popup fires. `null` = disabled. */
  lowBalanceFloor: number | null
  setLowBalanceFloor: (floor: number | null) => void

  /** Running total of `cost` across completed jobs since the last manual reset. Persists across
   *  reloads and model switches — only `resetSessionSpend` zeroes it. */
  sessionSpend: number
  addSessionSpend: (amount: number) => void
  resetSessionSpend: () => void

  /** Whether each popup has already fired for the current crossing, so it doesn't re-fire on
   *  every job/poll until the value drops back under the threshold (re-arming) or is reset. */
  spendCapAlerted: boolean
  setSpendCapAlerted: (alerted: boolean) => void
  lowBalanceAlerted: boolean
  setLowBalanceAlerted: (alerted: boolean) => void
}

export const usePreferencesStore = create<PreferencesState>((set, get) => ({
  preferredOutputFormat: loadPreferredOutputFormat(),
  setPreferredOutputFormat: (format) => {
    localStorage.setItem(STORAGE_KEY, format)
    set({ preferredOutputFormat: format })
  },
  defaultModelId: loadDefaultModelId(),
  setDefaultModelId: (modelId) => {
    localStorage.setItem(DEFAULT_MODEL_STORAGE_KEY, modelId)
    set({ defaultModelId: modelId })
  },
  theme: loadTheme(),
  setTheme: (theme) => {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
    applyTheme(theme)
    set({ theme })
  },

  customTheme: loadCustomTheme(),
  setCustomTheme: (overrides) => {
    saveCustomTheme(overrides)
    set({ customTheme: overrides })
  },
  resetCustomTheme: () => {
    clearCustomTheme()
    set({ customTheme: null })
  },

  hideIntroduction: loadHideIntroduction(),
  setHideIntroduction: (hide) => {
    localStorage.setItem(HIDE_INTRODUCTION_STORAGE_KEY, String(hide))
    set({ hideIntroduction: hide })
  },

  spendCap: loadPositiveNumber(SPEND_CAP_STORAGE_KEY),
  setSpendCap: (cap) => {
    if (cap === null) localStorage.removeItem(SPEND_CAP_STORAGE_KEY)
    else localStorage.setItem(SPEND_CAP_STORAGE_KEY, String(cap))
    set({ spendCap: cap, spendCapAlerted: false })
  },
  lowBalanceFloor: loadPositiveNumber(LOW_BALANCE_FLOOR_STORAGE_KEY),
  setLowBalanceFloor: (floor) => {
    if (floor === null) localStorage.removeItem(LOW_BALANCE_FLOOR_STORAGE_KEY)
    else localStorage.setItem(LOW_BALANCE_FLOOR_STORAGE_KEY, String(floor))
    set({ lowBalanceFloor: floor, lowBalanceAlerted: false })
  },

  sessionSpend: loadSessionSpend(),
  addSessionSpend: (amount) => {
    const sessionSpend = get().sessionSpend + amount
    localStorage.setItem(SESSION_SPEND_STORAGE_KEY, String(sessionSpend))
    set({ sessionSpend })
  },
  resetSessionSpend: () => {
    localStorage.setItem(SESSION_SPEND_STORAGE_KEY, '0')
    set({ sessionSpend: 0, spendCapAlerted: false })
  },

  spendCapAlerted: false,
  setSpendCapAlerted: (alerted) => set({ spendCapAlerted: alerted }),
  lowBalanceAlerted: false,
  setLowBalanceAlerted: (alerted) => set({ lowBalanceAlerted: alerted }),
}))
