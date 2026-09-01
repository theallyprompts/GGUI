import { create } from 'zustand'

const STORAGE_KEY = 'runware-generator:api-key'

interface ApiKeyState {
  apiKey: string | null
  setApiKey: (key: string | null) => void
  clearApiKey: () => void
}

export const useApiKeyStore = create<ApiKeyState>((set) => ({
  apiKey: localStorage.getItem(STORAGE_KEY),
  setApiKey: (key) => {
    if (key) localStorage.setItem(STORAGE_KEY, key)
    else localStorage.removeItem(STORAGE_KEY)
    set({ apiKey: key })
  },
  clearApiKey: () => {
    localStorage.removeItem(STORAGE_KEY)
    set({ apiKey: null })
  },
}))
