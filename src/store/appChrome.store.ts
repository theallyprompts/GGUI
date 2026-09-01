import { create } from 'zustand'

/** Cross-cutting UI chrome (modals owned by Header) that other panes — like the Introduction
 *  page — need to trigger without owning the modal state themselves. */
interface AppChromeState {
  showSettings: boolean
  openSettings: () => void
  closeSettings: () => void
  showMyModels: boolean
  openMyModels: () => void
  closeMyModels: () => void
  showStats: boolean
  openStats: () => void
  closeStats: () => void
  /** Modality tab (e.g. "Image", "Video", "Utilities") to preselect, or undefined for "All". */
  browseModelsCategory: string | undefined
  showBrowseModels: boolean
  openBrowseModels: (category?: string) => void
  closeBrowseModels: () => void
}

export const useAppChromeStore = create<AppChromeState>((set) => ({
  showSettings: false,
  openSettings: () => set({ showSettings: true }),
  closeSettings: () => set({ showSettings: false }),
  showMyModels: false,
  openMyModels: () => set({ showMyModels: true }),
  closeMyModels: () => set({ showMyModels: false }),
  showStats: false,
  openStats: () => set({ showStats: true }),
  closeStats: () => set({ showStats: false }),
  browseModelsCategory: undefined,
  showBrowseModels: false,
  openBrowseModels: (category) => set({ showBrowseModels: true, browseModelsCategory: category }),
  closeBrowseModels: () => set({ showBrowseModels: false }),
}))
