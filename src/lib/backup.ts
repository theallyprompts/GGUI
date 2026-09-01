const KEY_PREFIX = 'runware-generator:'
const API_KEY_STORAGE_KEY = 'runware-generator:api-key'

interface BackupFile {
  app: 'runware-generator'
  version: 1
  exportedAt: string
  entries: Record<string, string>
}

function allAppKeys(): string[] {
  const keys: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith(KEY_PREFIX)) keys.push(key)
  }
  return keys
}

/**
 * Serializes every `runware-generator:`-prefixed localStorage key (jobs, My Media
 * library, Prompt Studio entries, all preferences, results-feed display settings,
 * sidebar width, ...) into one JSON backup file. New persisted settings are picked up
 * automatically with no code changes here, since this scans by key prefix rather than
 * naming each setting.
 *
 * The API key is excluded unless `includeApiKey` is explicitly set — it's a live
 * credential, and writing it in plaintext into a downloadable file is a real footgun
 * most users exporting a "settings backup" wouldn't expect.
 */
export function exportBackup(options?: { includeApiKey?: boolean }): string {
  const entries: Record<string, string> = {}
  for (const key of allAppKeys()) {
    if (key === API_KEY_STORAGE_KEY && !options?.includeApiKey) continue
    const value = localStorage.getItem(key)
    if (value !== null) entries[key] = value
  }
  const payload: BackupFile = {
    app: 'runware-generator',
    version: 1,
    exportedAt: new Date().toISOString(),
    entries,
  }
  return JSON.stringify(payload, null, 2)
}

export interface ImportBackupResult {
  restored: number
  skipped: number
}

/**
 * Restores every entry from a previously exported backup file, overwriting whatever is
 * currently in localStorage under the same keys — this is a deliberate full restore, not
 * an additive merge (unlike My Media's import), since these are single-value settings
 * rather than a list of items that could sensibly be unioned.
 */
export function importBackup(json: string): ImportBackupResult | null {
  let parsed: Partial<BackupFile>
  try {
    parsed = JSON.parse(json) as Partial<BackupFile>
  } catch {
    return null
  }
  if (parsed.app !== 'runware-generator' || typeof parsed.entries !== 'object' || parsed.entries === null) {
    return null
  }

  let restored = 0
  let skipped = 0
  for (const [key, value] of Object.entries(parsed.entries)) {
    if (!key.startsWith(KEY_PREFIX) || typeof value !== 'string') {
      skipped++
      continue
    }
    try {
      localStorage.setItem(key, value)
      restored++
    } catch {
      skipped++
    }
  }
  return { restored, skipped }
}

export function downloadBackup(json: string): void {
  const blob = new Blob([json], { type: 'application/json' })
  const objectUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = objectUrl
  a.download = `runware-generator-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(objectUrl)
}
