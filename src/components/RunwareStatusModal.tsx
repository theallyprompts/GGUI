import { useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { Modal } from './Modal'
import { useRunwareStatusStore } from '../store/runwareStatus.store'
import type { Incident } from '../lib/runwareStatus/types'

const INDICATOR_STYLES: Record<string, { dot: string; text: string; label: string }> = {
  none: { dot: 'bg-brand-green', text: 'text-brand-green-text', label: 'Operational' },
  minor: { dot: 'bg-yellow-500', text: 'text-yellow-500', label: 'Minor issues' },
  major: { dot: 'bg-orange-500', text: 'text-orange-500', label: 'Major outage' },
  critical: { dot: 'bg-brand-destructive', text: 'text-brand-destructive', label: 'Critical outage' },
}

const COMPONENT_STATUS_LABELS: Record<string, string> = {
  operational: 'Operational',
  degraded_performance: 'Degraded',
  partial_outage: 'Partial outage',
  major_outage: 'Major outage',
  under_maintenance: 'Maintenance',
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

interface RunwareStatusModalProps {
  onClose: () => void
}

export function RunwareStatusModal({ onClose }: RunwareStatusModalProps) {
  const summary = useRunwareStatusStore((s) => s.summary)
  const incidents = useRunwareStatusStore((s) => s.incidents)
  const isLoading = useRunwareStatusStore((s) => s.isLoading)
  const error = useRunwareStatusStore((s) => s.error)

  const indicator = summary ? INDICATOR_STYLES[summary.status.indicator] ?? INDICATOR_STYLES.none : null

  return (
    <Modal title="Runware status" onClose={onClose} widthClassName="max-w-lg">
      {isLoading && !summary && <p className="py-6 text-center text-sm text-neutral-40">Loading…</p>}

      {error && !summary && (
        <p className="py-6 text-center text-sm text-brand-destructive">{error}</p>
      )}

      {summary && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 rounded-md border border-neutral-70 bg-input p-3">
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${indicator?.dot}`} />
            <p className={`text-sm font-semibold ${indicator?.text}`}>{summary.status.description}</p>
          </div>

          <div>
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-neutral-40">
              Components
            </p>
            <div className="divide-y divide-neutral-70 rounded-md border border-neutral-70">
              {summary.components.map((component) => (
                <div
                  key={component.id}
                  className="flex items-center justify-between px-3 py-2 text-sm"
                >
                  <span className="text-neutral-20">{component.name}</span>
                  <span
                    className={
                      component.status === 'operational' ? 'text-brand-green-text' : 'text-yellow-500'
                    }
                  >
                    {COMPONENT_STATUS_LABELS[component.status] ?? component.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-neutral-40">
              Recent incidents
            </p>
            {incidents.length === 0 ? (
              <p className="py-3 text-center text-sm text-neutral-40">No recent incidents.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {incidents.slice(0, 8).map((incident) => (
                  <IncidentRow key={incident.id} incident={incident} />
                ))}
              </div>
            )}
          </div>

          <a
            href="https://status.runware.ai/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-1.5 text-xs font-medium text-brand-green-text hover:underline"
          >
            View full status page
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}
    </Modal>
  )
}

function IncidentRow({ incident }: { incident: Incident }) {
  const [expanded, setExpanded] = useState(false)
  const isResolved = incident.status === 'resolved'

  return (
    <div className="rounded-md border border-neutral-70 bg-input p-2.5">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-start justify-between gap-2 text-left"
      >
        <div className="min-w-0">
          <p className="text-sm text-neutral-5">{incident.name}</p>
          <p className="mt-0.5 text-xs text-neutral-40">{formatDate(incident.created_at)}</p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
            isResolved
              ? 'bg-brand-green/10 text-brand-green-text'
              : 'bg-yellow-500/10 text-yellow-500'
          }`}
        >
          {isResolved ? 'Resolved' : incident.status}
        </span>
      </button>

      {expanded && (
        <div className="mt-2 space-y-1.5 border-t border-neutral-70 pt-2">
          {incident.incident_updates.map((update) => (
            <div key={update.id} className="text-xs">
              <span className="font-medium text-neutral-30 capitalize">{update.status}</span>{' '}
              <span className="text-neutral-40">— {formatDate(update.created_at)}</span>
              <p className="mt-0.5 text-neutral-20">{update.body}</p>
            </div>
          ))}
          <a
            href={`https://status.runware.ai/incidents/${incident.id}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-brand-green-text hover:underline"
          >
            View incident
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}
    </div>
  )
}
