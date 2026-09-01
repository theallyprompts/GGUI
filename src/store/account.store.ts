import { create } from 'zustand'
import { getAccountDetails } from '../lib/runware/client'

interface AccountState {
  balance: number | null
  isLoading: boolean
  error: string | null
  fetchBalance: (apiKey: string) => Promise<void>
  clear: () => void
}

export const useAccountStore = create<AccountState>((set) => ({
  balance: null,
  isLoading: false,
  error: null,
  fetchBalance: async (apiKey) => {
    set({ isLoading: true, error: null })
    try {
      const details = await getAccountDetails(apiKey)
      if (typeof details.balance !== 'number') {
        set({ balance: null, isLoading: false, error: 'Unexpected response shape from Runware.' })
        return
      }
      set({ balance: details.balance, isLoading: false })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to load balance.', isLoading: false })
    }
  },
  clear: () => set({ balance: null, isLoading: false, error: null }),
}))
