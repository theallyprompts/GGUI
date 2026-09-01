import { useEffect, useState } from 'react'
import { Settings, CircleDollarSign, RefreshCw, Activity, FolderOpen, BookText, Images } from 'lucide-react'
import { useApiKeyStore } from '../store/apiKey.store'
import { useAccountStore } from '../store/account.store'
import { useRunwareStatusStore } from '../store/runwareStatus.store'
import { useGenerationStore } from '../store/generation.store'
import { useAppChromeStore } from '../store/appChrome.store'
import { SettingsModal } from './SettingsModal'
import { StatsModal } from './StatsModal'
import { RunwareStatusModal } from './RunwareStatusModal'
import { MyModelsModal } from './MyModelsModal'
import { BrowseModelsModal } from './BrowseModelsModal'

const BALANCE_REFRESH_MS = 60_000
const STATUS_REFRESH_MS = 60_000

const INDICATOR_DOT: Record<string, string> = {
  none: 'bg-brand-green',
  minor: 'bg-yellow-500',
  major: 'bg-orange-500',
  critical: 'bg-brand-destructive',
}

function StatusIndicator({ onClick }: { onClick: () => void }) {
  const summary = useRunwareStatusStore((s) => s.summary)
  const fetchStatus = useRunwareStatusStore((s) => s.fetchStatus)

  useEffect(() => {
    void fetchStatus()
    const interval = setInterval(() => void fetchStatus(), STATUS_REFRESH_MS)
    return () => clearInterval(interval)
  }, [fetchStatus])

  const dotColor = summary ? INDICATOR_DOT[summary.status.indicator] ?? INDICATOR_DOT.none : 'bg-neutral-50'

  return (
    <button
      onClick={onClick}
      title={summary ? `Runware status: ${summary.status.description}` : 'Runware status'}
      aria-label="Runware status"
      className="relative shrink-0 rounded-md p-2 text-neutral-30 transition-colors hover:bg-neutral-80 hover:text-neutral-5"
    >
      <Activity className="h-4 w-4" />
      <span
        className={`absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full ring-1 ring-card ${dotColor}`}
      />
    </button>
  )
}

function BalanceDisplay() {
  const apiKey = useApiKeyStore((s) => s.apiKey)
  const balance = useAccountStore((s) => s.balance)
  const isLoading = useAccountStore((s) => s.isLoading)
  const error = useAccountStore((s) => s.error)
  const fetchBalance = useAccountStore((s) => s.fetchBalance)
  const clear = useAccountStore((s) => s.clear)

  useEffect(() => {
    if (!apiKey) {
      clear()
      return
    }
    void fetchBalance(apiKey)
    const interval = setInterval(() => void fetchBalance(apiKey), BALANCE_REFRESH_MS)
    return () => clearInterval(interval)
  }, [apiKey, fetchBalance, clear])

  if (!apiKey) return null

  return (
    <button
      onClick={() => void fetchBalance(apiKey)}
      disabled={isLoading}
      title={error ?? 'Runware account balance — click to refresh'}
      className="flex shrink-0 items-center gap-1.5 rounded-md border border-brand-green-text/30 bg-brand-green/10 px-2.5 py-1 text-sm font-semibold text-brand-green-text transition-colors hover:bg-brand-green/15 disabled:cursor-wait"
    >
      {balance !== null ? (
        <span className="font-mono">${balance.toFixed(2)}</span>
      ) : error ? (
        <span className="text-brand-destructive">Balance unavailable</span>
      ) : (
        <span className="text-neutral-40">Loading…</span>
      )}
      <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
    </button>
  )
}

export function Header() {
  const showSettings = useAppChromeStore((s) => s.showSettings)
  const openSettings = useAppChromeStore((s) => s.openSettings)
  const closeSettings = useAppChromeStore((s) => s.closeSettings)
  const showMyModels = useAppChromeStore((s) => s.showMyModels)
  const openMyModels = useAppChromeStore((s) => s.openMyModels)
  const closeMyModels = useAppChromeStore((s) => s.closeMyModels)
  const showBrowseModels = useAppChromeStore((s) => s.showBrowseModels)
  const browseModelsCategory = useAppChromeStore((s) => s.browseModelsCategory)
  const closeBrowseModels = useAppChromeStore((s) => s.closeBrowseModels)
  const showStats = useAppChromeStore((s) => s.showStats)
  const openStats = useAppChromeStore((s) => s.openStats)
  const closeStats = useAppChromeStore((s) => s.closeStats)
  const [showStatus, setShowStatus] = useState(false)
  const mainView = useGenerationStore((s) => s.mainView)
  const setMainView = useGenerationStore((s) => s.setMainView)

  return (
    <header className="flex h-12 shrink-0 items-center justify-between gap-2 border-b border-neutral-70 bg-card px-2 sm:px-4">
      <div className="flex min-w-0 items-center gap-3">
        <span className="truncate text-sm font-medium text-neutral-30">Generic Generative UI</span>
      </div>
      <div className="flex shrink-0 items-center gap-0.5 overflow-x-auto sm:gap-2">
        <BalanceDisplay />
        <button
          onClick={() => setMainView(mainView === 'promptStudio' ? 'gallery' : 'promptStudio')}
          title={mainView === 'promptStudio' ? 'Back to Gallery' : 'Open Prompt Studio'}
          aria-label={mainView === 'promptStudio' ? 'Back to Gallery' : 'Open Prompt Studio'}
          className="flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-neutral-30 transition-colors hover:bg-brand-green/10 hover:text-brand-green-text"
        >
          {mainView === 'promptStudio' ? <Images className="h-4 w-4" /> : <BookText className="h-4 w-4" />}
          <span className="hidden sm:inline">{mainView === 'promptStudio' ? 'Gallery' : 'Prompt Studio'}</span>
        </button>
        <button
          onClick={openMyModels}
          title="My uploaded models"
          aria-label="My uploaded models"
          className="shrink-0 rounded-md p-2 text-neutral-30 transition-colors hover:bg-neutral-80 hover:text-neutral-5"
        >
          <FolderOpen className="h-4 w-4" />
        </button>
        <StatusIndicator onClick={() => setShowStatus(true)} />
        <button
          onClick={openStats}
          title="Usage & spend"
          aria-label="Usage & spend"
          className="shrink-0 rounded-md p-2 text-neutral-30 transition-colors hover:bg-neutral-80 hover:text-neutral-5"
        >
          <CircleDollarSign className="h-4 w-4" />
        </button>
        <button
          onClick={openSettings}
          title="Settings"
          aria-label="Settings"
          className="shrink-0 rounded-md p-2 text-neutral-30 transition-colors hover:bg-neutral-80 hover:text-neutral-5"
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>

      {showSettings && <SettingsModal onClose={closeSettings} />}
      {showStats && <StatsModal onClose={closeStats} />}
      {showStatus && <RunwareStatusModal onClose={() => setShowStatus(false)} />}
      {showMyModels && <MyModelsModal onClose={closeMyModels} />}
      {showBrowseModels && (
        <BrowseModelsModal onClose={closeBrowseModels} initialCategory={browseModelsCategory} />
      )}
    </header>
  )
}
