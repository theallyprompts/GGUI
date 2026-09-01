import { create } from 'zustand'
import { getRecentIncidents, getStatusSummary } from '../lib/runwareStatus/client'
import type { Incident, StatusSummary } from '../lib/runwareStatus/types'

interface RunwareStatusState {
  summary: StatusSummary | null
  incidents: Incident[]
  isLoading: boolean
  error: string | null
  fetchStatus: () => Promise<void>
}

export const useRunwareStatusStore = create<RunwareStatusState>((set) => ({
  summary: null,
  incidents: [],
  isLoading: false,
  error: null,
  fetchStatus: async () => {
    set({ isLoading: true, error: null })
    try {
      const [summary, { incidents }] = await Promise.all([getStatusSummary(), getRecentIncidents()])
      set({ summary, incidents, isLoading: false })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to load status.', isLoading: false })
    }
  },
}))
