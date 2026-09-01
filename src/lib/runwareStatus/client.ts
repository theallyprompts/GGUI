import type { IncidentsResponse, StatusSummary } from './types'

const STATUS_BASE = 'https://status.runware.ai/api/v2'

export async function getStatusSummary(): Promise<StatusSummary> {
  const res = await fetch(`${STATUS_BASE}/summary.json`)
  if (!res.ok) throw new Error(`Status summary request failed (HTTP ${res.status})`)
  return res.json()
}

export async function getRecentIncidents(): Promise<IncidentsResponse> {
  const res = await fetch(`${STATUS_BASE}/incidents.json`)
  if (!res.ok) throw new Error(`Incidents request failed (HTTP ${res.status})`)
  return res.json()
}
