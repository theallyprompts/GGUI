import { create } from 'zustand'
import { searchModels } from '../lib/runware/client'
import type { ModelSearchResultItem } from '../lib/runware/types'

interface MyModelsState {
  models: ModelSearchResultItem[] | null
  isLoading: boolean
  error: string | null
  fetchModels: (apiKey: string) => Promise<void>
  clear: () => void
}

export const useMyModelsStore = create<MyModelsState>((set) => ({
  models: null,
  isLoading: false,
  error: null,
  fetchModels: async (apiKey) => {
    set({ isLoading: true, error: null })
    try {
      const { data } = await searchModels(apiKey, { search: '', visibility: 'owned', limit: 100 })
      set({ models: data[0]?.results ?? [], isLoading: false })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to load your models.', isLoading: false })
    }
  },
  clear: () => set({ models: null, isLoading: false, error: null }),
}))
