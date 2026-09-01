import { useRef, useState } from 'react'
import { Moon, Sun, Palette, Download, Upload, RotateCcw } from 'lucide-react'
import { useApiKeyStore } from '../store/apiKey.store'
import { usePreferencesStore, type PreferredOutputFormat, type Theme } from '../store/preferences.store'
import { validateApiKey } from '../lib/runware/client'
import { exportBackup, downloadBackup, importBackup } from '../lib/backup'
import { exportCustomThemeCss, parseCustomThemeCss, type CustomThemeOverrides } from '../lib/customTheme'
import { MODELS } from '../lib/models'
import { Modal } from './Modal'

/** Reads the current live values of the overridable CSS variables — used to seed the color
 *  pickers with whatever's actually rendering (built-in theme default, or a saved custom one)
 *  rather than a hardcoded snapshot that would be wrong in light mode. Custom properties are
 *  stored (and returned) as the literal #hex string from index.css, not a resolved rgb(...), so
 *  no format conversion is needed for the <input type="color"> value. */
function readLiveThemeColors(): CustomThemeOverrides {
  const style = getComputedStyle(document.documentElement)
  const read = (v: string) => style.getPropertyValue(v).trim() || '#000000'
  return {
    accent: read('--color-brand-green'),
    bg: read('--color-bg'),
    card: read('--color-card'),
    border: read('--color-border'),
    input: read('--color-input'),
  }
}

const OUTPUT_FORMAT_OPTIONS: PreferredOutputFormat[] = ['PNG', 'JPG', 'WEBP']
const DEFAULT_MODEL_OPTIONS = MODELS.filter((m) => !m.hidden && m.taskType !== 'introduction')

const SETTINGS_TABS = ['API', 'Visual', 'Defaults', 'Backup'] as const
type SettingsTab = (typeof SETTINGS_TABS)[number]

function maskKey(key: string): string {
  if (key.length <= 8) return '••••••••'
  return `${key.slice(0, 4)}${'•'.repeat(8)}${key.slice(-4)}`
}

/** Wraps one related set of settings (e.g. "Theme", "Custom colors") in a bordered box so it
 *  reads as a single group in the tab, instead of every option floating loosely in one column. */
function SettingsGroup({ children }: { children: React.ReactNode }) {
  return <div className="rounded-md border border-neutral-70 p-3">{children}</div>
}

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<SettingsTab>('API')

  return (
    <Modal title="Settings" onClose={onClose}>
      <div className="-mt-1 mb-4 flex border-b border-neutral-70">
        {SETTINGS_TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-1 border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              tab === t
                ? 'border-brand-green text-neutral-5'
                : 'border-transparent text-neutral-40 hover:text-neutral-20'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'API' && <ApiTab onClose={onClose} />}
      {tab === 'Visual' && <VisualTab />}
      {tab === 'Defaults' && <DefaultsTab />}
      {tab === 'Backup' && <BackupTab />}
    </Modal>
  )
}

function ApiTab({ onClose }: { onClose: () => void }) {
  const apiKey = useApiKeyStore((s) => s.apiKey)
  const setApiKey = useApiKeyStore((s) => s.setApiKey)
  const clearApiKey = useApiKeyStore((s) => s.clearApiKey)

  const [value, setValue] = useState('')
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = value.trim()
    if (!trimmed) return

    setChecking(true)
    setError(null)
    try {
      const valid = await validateApiKey(trimmed)
      if (!valid) {
        setError('That API key was rejected by Runware. Double-check it and try again.')
        return
      }
      setApiKey(trimmed)
      setValue('')
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2000)
    } catch {
      setError('Could not reach Runware right now. Please try again in a moment.')
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="space-y-4">
      <SettingsGroup>
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-neutral-40">
              Current API key
            </label>
            <div className="rounded-md border border-neutral-70 bg-input px-3 py-2 font-mono text-sm text-neutral-20">
              {apiKey ? maskKey(apiKey) : 'None set'}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-2">
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-neutral-40">
              Replace with a new key
            </label>
            <input
              type="password"
              autoComplete="off"
              spellCheck={false}
              placeholder="rw_..."
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full rounded-md border border-neutral-70 bg-input px-3 py-2 text-sm text-neutral-5 placeholder-neutral-50 outline-none focus:border-brand-green-text"
            />
            {error && <p className="text-sm text-brand-destructive">{error}</p>}
            {success && <p className="text-sm text-brand-green-text">Key updated.</p>}
            <button
              type="submit"
              disabled={checking || !value.trim()}
              className="w-full rounded-md bg-brand-green px-3 py-2 text-sm font-semibold text-on-brand transition hover:bg-brand-green-mid disabled:cursor-not-allowed disabled:opacity-50"
            >
              {checking ? 'Checking…' : 'Save key'}
            </button>
          </form>
        </div>
      </SettingsGroup>

      <SettingsGroup>
        <button
          onClick={() => {
            if (confirm('Sign out and remove the saved API key from this browser?')) {
              clearApiKey()
              onClose()
            }
          }}
          className="w-full rounded-md border border-neutral-70 px-3 py-2 text-sm font-medium text-neutral-30 hover:bg-neutral-80 hover:text-neutral-5"
        >
          Sign out
        </button>
      </SettingsGroup>
    </div>
  )
}

function VisualTab() {
  const theme = usePreferencesStore((s) => s.theme)
  const setTheme = usePreferencesStore((s) => s.setTheme)
  const customTheme = usePreferencesStore((s) => s.customTheme)
  const setCustomTheme = usePreferencesStore((s) => s.setCustomTheme)
  const resetCustomTheme = usePreferencesStore((s) => s.resetCustomTheme)
  const hideIntroduction = usePreferencesStore((s) => s.hideIntroduction)
  const setHideIntroduction = usePreferencesStore((s) => s.setHideIntroduction)

  // Re-read on every theme flip so the picker preview matches whichever built-in light/dark
  // surface colors are actually rendering when there's no custom override yet.
  const active = customTheme ?? readLiveThemeColors()
  const importInputRef = useRef<HTMLInputElement>(null)
  const [importError, setImportError] = useState<string | null>(null)

  function patchTheme(patch: Partial<CustomThemeOverrides>) {
    setCustomTheme({ ...active, ...patch })
  }

  function handleExportCss() {
    const css = exportCustomThemeCss(active)
    const blob = new Blob([css], { type: 'text/css' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'runware-generator-theme.css'
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImportFile(file: File | undefined | null) {
    if (!file) return
    setImportError(null)
    const reader = new FileReader()
    reader.onload = () => {
      const parsed = parseCustomThemeCss(reader.result as string)
      if (!parsed) {
        setImportError("That file doesn't look like a Runware Generator theme export.")
        return
      }
      setCustomTheme(parsed)
    }
    reader.onerror = () => setImportError('Could not read that file.')
    reader.readAsText(file)
  }

  return (
    <div className="space-y-4">
      <SettingsGroup>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-neutral-40">
          Theme
        </label>
        <div className="flex gap-1.5">
          {(
            [
              { value: 'dark', label: 'Dark', icon: Moon },
              { value: 'light', label: 'Light', icon: Sun },
            ] satisfies { value: Theme; label: string; icon: typeof Moon }[]
          ).map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setTheme(value)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                theme === value
                  ? 'border-brand-green-text bg-brand-green/10 text-brand-green-text'
                  : 'border-neutral-70 text-neutral-30 hover:bg-neutral-80 hover:text-neutral-5'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
      </SettingsGroup>

      <SettingsGroup>
        <div className="mb-1.5 flex items-center gap-1.5">
          <Palette className="h-3.5 w-3.5 text-neutral-40" />
          <label className="text-xs font-medium uppercase tracking-wide text-neutral-40">
            Custom colors
          </label>
        </div>
        <p className="mb-2 text-xs text-neutral-40">
          Purely cosmetic — recolor the accent and background surfaces however you like. Doesn't
          affect functionality, and you can reset back to the default Runware green any time.
        </p>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {(
            [
              { key: 'accent', label: 'Accent' },
              { key: 'bg', label: 'Background' },
              { key: 'card', label: 'Card' },
              { key: 'border', label: 'Border' },
              { key: 'input', label: 'Input' },
            ] satisfies { key: keyof CustomThemeOverrides; label: string }[]
          ).map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 text-sm text-neutral-20">
              <input
                type="color"
                value={active[key]}
                onChange={(e) => patchTheme({ [key]: e.target.value })}
                className="h-7 w-7 shrink-0 cursor-pointer rounded border border-neutral-70 bg-transparent p-0.5"
              />
              {label}
            </label>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportCss}
            className="flex items-center gap-1.5 rounded-md border border-neutral-70 bg-input px-2.5 py-1.5 text-xs font-medium text-neutral-20 transition-colors hover:bg-neutral-80 hover:text-neutral-5"
          >
            <Download className="h-3.5 w-3.5" />
            Export as CSS
          </button>
          <button
            type="button"
            onClick={() => importInputRef.current?.click()}
            className="flex items-center gap-1.5 rounded-md border border-neutral-70 bg-input px-2.5 py-1.5 text-xs font-medium text-neutral-20 transition-colors hover:bg-neutral-80 hover:text-neutral-5"
          >
            <Upload className="h-3.5 w-3.5" />
            Import CSS
          </button>
          <input
            ref={importInputRef}
            type="file"
            accept=".css,text/css"
            className="hidden"
            onChange={(e) => {
              handleImportFile(e.target.files?.[0])
              e.target.value = ''
            }}
          />
          {customTheme && (
            <button
              type="button"
              onClick={resetCustomTheme}
              className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-neutral-40 hover:text-neutral-20"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset to default
            </button>
          )}
        </div>
        {importError && <p className="mt-2 text-xs text-brand-destructive">{importError}</p>}
      </SettingsGroup>

      <SettingsGroup>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-neutral-40">
          Introduction page
        </label>
        <label className="flex items-center gap-2 text-sm text-neutral-20">
          <input
            type="checkbox"
            checked={hideIntroduction}
            onChange={(e) => setHideIntroduction(e.target.checked)}
            className="h-3.5 w-3.5 accent-brand-green"
          />
          Don't show the Introduction page on startup
        </label>
        <p className="mt-1.5 text-xs text-neutral-40">
          You can still open it any time from the top of the Model dropdown.
        </p>
      </SettingsGroup>
    </div>
  )
}

function DefaultsTab() {
  const preferredOutputFormat = usePreferencesStore((s) => s.preferredOutputFormat)
  const setPreferredOutputFormat = usePreferencesStore((s) => s.setPreferredOutputFormat)
  const defaultModelId = usePreferencesStore((s) => s.defaultModelId)
  const setDefaultModelId = usePreferencesStore((s) => s.setDefaultModelId)

  return (
    <div className="space-y-4">
      <SettingsGroup>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-neutral-40">
          Preferred output format
        </label>
        <div className="flex gap-1.5">
          {OUTPUT_FORMAT_OPTIONS.map((format) => (
            <button
              key={format}
              type="button"
              onClick={() => setPreferredOutputFormat(format)}
              className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                preferredOutputFormat === format
                  ? 'border-brand-green-text bg-brand-green/10 text-brand-green-text'
                  : 'border-neutral-70 text-neutral-30 hover:bg-neutral-80 hover:text-neutral-5'
              }`}
            >
              {format}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-neutral-40">
          Default format for new generations. You can still override it per-request.
        </p>
      </SettingsGroup>

      <SettingsGroup>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-neutral-40">
          Default model or utility
        </label>
        <select
          value={defaultModelId}
          onChange={(e) => setDefaultModelId(e.target.value)}
          className="w-full rounded-md border border-neutral-70 bg-input px-2.5 py-1.5 text-sm text-neutral-5 outline-none focus:border-brand-green-text"
        >
          {DEFAULT_MODEL_OPTIONS.map((model) => (
            <option key={model.id} value={model.id}>
              {model.label}
            </option>
          ))}
        </select>
        <p className="mt-1.5 text-xs text-neutral-40">
          The Reset button on the Generate pane clears the current form and returns to this
          model or utility.
        </p>
      </SettingsGroup>
    </div>
  )
}

function BackupTab() {
  const [includeApiKey, setIncludeApiKey] = useState(false)
  const [importMessage, setImportMessage] = useState<string | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleExport() {
    const json = exportBackup({ includeApiKey })
    downloadBackup(json)
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setImportMessage(null)
    setImportError(null)

    const reader = new FileReader()
    reader.onload = () => {
      const result = importBackup(reader.result as string)
      if (!result) {
        setImportError('That file doesn\'t look like a Runware Generator backup.')
        return
      }
      setImportMessage(
        `Restored ${result.restored} setting${result.restored === 1 ? '' : 's'}` +
          (result.skipped > 0 ? `, skipped ${result.skipped}` : '') +
          '. Reload the page to see everything applied.',
      )
    }
    reader.onerror = () => setImportError('Could not read that file.')
    reader.readAsText(file)
  }

  return (
    <div className="space-y-4">
      <SettingsGroup>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-neutral-40">
          Export backup
        </label>
        <p className="mb-2 text-xs text-neutral-40">
          Downloads everything stored in this browser — generation history, My Media
          library, Prompt Studio (saved prompts and fragments), theme, defaults, and
          spend settings — as a JSON file you can keep or move to another browser/device.
        </p>
        <label className="mb-2 flex items-center gap-2 text-sm text-neutral-20">
          <input
            type="checkbox"
            checked={includeApiKey}
            onChange={(e) => setIncludeApiKey(e.target.checked)}
            className="h-3.5 w-3.5 accent-brand-green"
          />
          Include my API key in the export
        </label>
        {includeApiKey && (
          <p className="mb-2 text-xs text-brand-destructive">
            The backup file will contain your API key in plain text. Only share it with
            people/places you trust.
          </p>
        )}
        <button
          type="button"
          onClick={handleExport}
          className="w-full rounded-md bg-brand-green px-3 py-2 text-sm font-semibold text-on-brand transition hover:bg-brand-green-mid"
        >
          Download backup
        </button>
      </SettingsGroup>

      <SettingsGroup>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-neutral-40">
          Import backup
        </label>
        <p className="mb-2 text-xs text-neutral-40">
          Restores settings from a previously exported backup file. Anything in the file
          overwrites the current value for that setting — everything else is left alone.
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          onChange={handleImportFile}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full rounded-md border border-neutral-70 bg-input px-3 py-2 text-sm font-medium text-neutral-30 hover:bg-neutral-80 hover:text-neutral-5"
        >
          Choose backup file…
        </button>
        {importMessage && <p className="mt-2 text-sm text-brand-green-text">{importMessage}</p>}
        {importError && <p className="mt-2 text-sm text-brand-destructive">{importError}</p>}
      </SettingsGroup>
    </div>
  )
}
