import { useEffect, useMemo, useState } from 'react'
import { ExternalLink, RefreshCw } from 'lucide-react'
import { useApiKeyStore } from '../store/apiKey.store'
import { useAccountStore } from '../store/account.store'
import { useUsageStore } from '../store/usage.store'
import { usePreferencesStore } from '../store/preferences.store'
import { Modal } from './Modal'

const DAY_MS = 24 * 60 * 60 * 1000

function toDateInput(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function defaultRange(): { startDate: string; endDate: string } {
  const end = new Date()
  const start = new Date(end.getTime() - 29 * DAY_MS)
  return { startDate: toDateInput(start), endDate: toDateInput(end) }
}

export function StatsModal({ onClose }: { onClose: () => void }) {
  const apiKey = useApiKeyStore((s) => s.apiKey)
  const activity = useUsageStore((s) => s.activity)
  const performance = useUsageStore((s) => s.performance)
  const errors = useUsageStore((s) => s.errors)
  const isLoading = useUsageStore((s) => s.isLoading)
  const error = useUsageStore((s) => s.error)
  const fetchUsage = useUsageStore((s) => s.fetchUsage)

  const balance = useAccountStore((s) => s.balance)
  const sessionSpend = usePreferencesStore((s) => s.sessionSpend)
  const spendCap = usePreferencesStore((s) => s.spendCap)
  const setSpendCap = usePreferencesStore((s) => s.setSpendCap)
  const lowBalanceFloor = usePreferencesStore((s) => s.lowBalanceFloor)
  const setLowBalanceFloor = usePreferencesStore((s) => s.setLowBalanceFloor)
  const resetSessionSpend = usePreferencesStore((s) => s.resetSessionSpend)

  const [spendCapInput, setSpendCapInput] = useState(spendCap !== null ? String(spendCap) : '')
  const [lowBalanceFloorInput, setLowBalanceFloorInput] = useState(
    lowBalanceFloor !== null ? String(lowBalanceFloor) : '',
  )

  const [{ startDate, endDate }, setRange] = useState(defaultRange)

  useEffect(() => {
    if (!apiKey) return
    void fetchUsage(apiKey, startDate, endDate)
  }, [apiKey, startDate, endDate, fetchUsage])

  const activityMeta = activity?.usage.model?.meta ?? activity?.usage.timeseries?.meta
  const perfMeta = performance?.usage.model?.meta
  const errorsMeta = errors?.usage.timeseries?.meta ?? errors?.usage.model?.meta

  const spendByModel = useMemo(() => {
    const rows = activity?.usage.model?.data ?? []
    const byModel = new Map<string, { modelName: string; spend: number; count: number }>()
    for (const row of rows) {
      const entry = byModel.get(row.model) ?? { modelName: row.modelName ?? row.model, spend: 0, count: 0 }
      entry.spend += row.spend
      entry.count += row.count
      byModel.set(row.model, entry)
    }
    return [...byModel.entries()]
      .map(([model, v]) => ({ model, ...v }))
      .sort((a, b) => b.spend - a.spend)
  }, [activity])

  const errorsByModel = useMemo(() => {
    const rows = errors?.usage.model?.data ?? []
    const byModel = new Map<string, { modelName: string; clientErrors: number; serverErrors: number }>()
    for (const row of rows) {
      const entry =
        byModel.get(row.model) ?? { modelName: row.modelName ?? row.model, clientErrors: 0, serverErrors: 0 }
      entry.clientErrors += row.clientErrors
      entry.serverErrors += row.serverErrors
      byModel.set(row.model, entry)
    }
    return [...byModel.entries()]
      .map(([model, v]) => ({ model, ...v }))
      .filter((r) => r.clientErrors + r.serverErrors > 0)
      .sort((a, b) => b.clientErrors + b.serverErrors - (a.clientErrors + a.serverErrors))
  }, [errors])

  const performanceByModel = useMemo(() => {
    const rows = performance?.usage.model?.data ?? []
    const byModel = new Map<string, { modelName: string; avg: number[]; p90: number[]; p99: number[] }>()
    for (const row of rows) {
      const entry = byModel.get(row.model) ?? {
        modelName: row.modelName ?? row.model,
        avg: [],
        p90: [],
        p99: [],
      }
      if (row.avgInferenceTime !== null) entry.avg.push(row.avgInferenceTime)
      if (row.p90InferenceTime !== null) entry.p90.push(row.p90InferenceTime)
      if (row.p99InferenceTime !== null) entry.p99.push(row.p99InferenceTime)
      byModel.set(row.model, entry)
    }
    const avg = (nums: number[]) => (nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null)
    return [...byModel.entries()].map(([model, v]) => ({
      model,
      modelName: v.modelName,
      avgInferenceTime: avg(v.avg),
      p90InferenceTime: avg(v.p90),
      p99InferenceTime: avg(v.p99),
    }))
  }, [performance])

  if (!apiKey) {
    return (
      <Modal title="Usage & spend" onClose={onClose} widthClassName="max-w-lg">
        <p className="py-6 text-center text-sm text-neutral-40">No API key set.</p>
      </Modal>
    )
  }

  return (
    <Modal title="Usage & spend" onClose={onClose} widthClassName="max-w-3xl">
      <div className="space-y-4">
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-neutral-20">From</label>
            <input
              type="date"
              value={startDate}
              max={endDate}
              onChange={(e) => setRange((r) => ({ ...r, startDate: e.target.value }))}
              className="rounded-md border border-neutral-70 bg-input px-2.5 py-1.5 text-sm text-neutral-5 outline-none focus:border-brand-green-text"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-neutral-20">To</label>
            <input
              type="date"
              value={endDate}
              min={startDate}
              max={toDateInput(new Date())}
              onChange={(e) => setRange((r) => ({ ...r, endDate: e.target.value }))}
              className="rounded-md border border-neutral-70 bg-input px-2.5 py-1.5 text-sm text-neutral-5 outline-none focus:border-brand-green-text"
            />
          </div>
          <button
            onClick={() => void fetchUsage(apiKey, startDate, endDate)}
            disabled={isLoading}
            title="Refresh"
            aria-label="Refresh"
            className="rounded-md border border-neutral-70 bg-input p-2 text-neutral-30 transition-colors hover:bg-neutral-80 hover:text-neutral-5 disabled:cursor-wait"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <a
            href="https://my.runware.ai"
            target="_blank"
            rel="noreferrer"
            className="ml-auto flex items-center gap-1.5 rounded-md bg-brand-green px-3 py-2 text-sm font-medium text-on-brand transition hover:bg-brand-green-mid"
          >
            Manage account
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>

        <p className="text-xs text-neutral-40">
          Runware limits each lookup to a 30-day span. Figures reflect your whole account's usage
          on this API key(s) — not just generations made in this browser.
        </p>

        <div className="rounded-md border border-neutral-70 p-3">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-neutral-40">Spend alerts</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-neutral-20">
                Warn me when this session's spend reaches
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-neutral-40">
                  $
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="No cap"
                  value={spendCapInput}
                  onChange={(e) => setSpendCapInput(e.target.value)}
                  onBlur={() => {
                    const parsed = Number(spendCapInput)
                    setSpendCap(Number.isFinite(parsed) && parsed > 0 ? parsed : null)
                    setSpendCapInput(Number.isFinite(parsed) && parsed > 0 ? String(parsed) : '')
                  }}
                  className="w-full rounded-md border border-neutral-70 bg-input py-1.5 pl-6 pr-2.5 text-sm text-neutral-5 outline-none focus:border-brand-green-text"
                />
              </div>
              <p className="mt-1 font-mono text-xs text-neutral-40">
                Session spend so far: ${sessionSpend.toFixed(4)}
              </p>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-neutral-20">
                Warn me when balance drops to
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-neutral-40">
                  $
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="No floor"
                  value={lowBalanceFloorInput}
                  onChange={(e) => setLowBalanceFloorInput(e.target.value)}
                  onBlur={() => {
                    const parsed = Number(lowBalanceFloorInput)
                    setLowBalanceFloor(Number.isFinite(parsed) && parsed > 0 ? parsed : null)
                    setLowBalanceFloorInput(Number.isFinite(parsed) && parsed > 0 ? String(parsed) : '')
                  }}
                  className="w-full rounded-md border border-neutral-70 bg-input py-1.5 pl-6 pr-2.5 text-sm text-neutral-5 outline-none focus:border-brand-green-text"
                />
              </div>
              <p className="mt-1 font-mono text-xs text-neutral-40">
                Current balance: {balance !== null ? `$${balance.toFixed(2)}` : '—'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (confirm('Reset the session spend counter to $0?')) resetSessionSpend()
            }}
            className="mt-3 rounded-md border border-neutral-70 px-2.5 py-1.5 text-xs font-medium text-neutral-30 hover:bg-neutral-80 hover:text-neutral-5"
          >
            Reset session spend counter
          </button>
        </div>

        {isLoading && !activity && <p className="py-6 text-center text-sm text-neutral-40">Loading…</p>}

        {error && (
          <p className="rounded-md border border-brand-destructive/30 bg-brand-destructive/10 p-3 text-sm text-brand-destructive">
            {error}
          </p>
        )}

        {activity && (
          <>
            <div className="grid grid-cols-3 gap-3">
              <SummaryStat label="Total spend" value={`$${(activityMeta?.totalSpend ?? 0).toFixed(4)}`} accent />
              <SummaryStat label="Total requests" value={String(activityMeta?.totalRequests ?? 0)} />
              <SummaryStat
                label="Projected spend"
                value={activityMeta?.projectedSpend !== undefined ? `$${activityMeta.projectedSpend.toFixed(4)}` : '—'}
              />
              <SummaryStat
                label="Avg daily spend"
                value={activityMeta?.avgDailySpend !== undefined ? `$${activityMeta.avgDailySpend.toFixed(4)}` : '—'}
              />
              <SummaryStat
                label="Avg inference time"
                value={perfMeta?.avgInferenceTime !== undefined ? `${perfMeta.avgInferenceTime.toFixed(2)}s` : '—'}
              />
              <SummaryStat
                label="Error rate"
                value={errorsMeta?.errorRate !== undefined ? `${errorsMeta.errorRate.toFixed(2)}%` : '—'}
                destructive={Boolean(errorsMeta?.errorRate)}
              />
            </div>

            <div>
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-neutral-40">
                Spend by model
              </p>
              {spendByModel.length === 0 ? (
                <p className="py-3 text-center text-sm text-neutral-40">No activity in this range.</p>
              ) : (
                <div className="divide-y divide-neutral-70 rounded-md border border-neutral-70">
                  {spendByModel.map((row) => {
                    const perf = performanceByModel.find((p) => p.model === row.model)
                    const errs = errorsByModel.find((e) => e.model === row.model)
                    return (
                      <div key={row.model} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-neutral-5">{row.modelName}</p>
                          <p className="truncate font-mono text-xs text-neutral-40">{row.model}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 font-mono text-sm sm:shrink-0">
                          <span className="text-brand-green-text">${row.spend.toFixed(4)}</span>
                          <span className="text-neutral-20">{row.count} reqs</span>
                          {perf?.avgInferenceTime !== null && perf?.avgInferenceTime !== undefined && (
                            <span className="text-neutral-40">{perf.avgInferenceTime.toFixed(2)}s avg</span>
                          )}
                          {errs && errs.clientErrors + errs.serverErrors > 0 && (
                            <span className="text-brand-destructive">
                              {errs.clientErrors + errs.serverErrors} errors
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}

function SummaryStat({
  label,
  value,
  accent,
  destructive,
}: {
  label: string
  value: string
  accent?: boolean
  destructive?: boolean
}) {
  return (
    <div className="rounded-md border border-neutral-70 bg-input p-3">
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-neutral-40">{label}</p>
      <p
        className={`font-mono text-lg font-semibold ${
          destructive ? 'text-brand-destructive' : accent ? 'text-brand-green-text' : 'text-neutral-5'
        }`}
      >
        {value}
      </p>
    </div>
  )
}
