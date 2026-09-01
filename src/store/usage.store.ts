import { create } from 'zustand'
import { getUsageActivity, getUsageErrors, getUsagePerformance } from '../lib/runware/client'
import type {
  UsageActivityResult,
  UsageErrorsResult,
  UsagePerformanceResult,
} from '../lib/runware/types'

interface UsageState {
  activity: UsageActivityResult | null
  performance: UsagePerformanceResult | null
  errors: UsageErrorsResult | null
  isLoading: boolean
  error: string | null
  fetchUsage: (apiKey: string, startDate: string, endDate: string) => Promise<void>
  clear: () => void
}

export const useUsageStore = create<UsageState>((set) => ({
  activity: null,
  performance: null,
  errors: null,
  isLoading: false,
  error: null,
  fetchUsage: async (apiKey, startDate, endDate) => {
    set({ isLoading: true, error: null })
    try {
      const params = { startDate, endDate, groupBy: ['date', 'model'] as ('date' | 'model')[] }
      const [activity, performance, errors] = await Promise.all([
        getUsageActivity(apiKey, params),
        getUsagePerformance(apiKey, params),
        getUsageErrors(apiKey, params),
      ])
      set({ activity, performance, errors, isLoading: false })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to load usage data.', isLoading: false })
    }
  },
  clear: () => set({ activity: null, performance: null, errors: null, isLoading: false, error: null }),
}))
