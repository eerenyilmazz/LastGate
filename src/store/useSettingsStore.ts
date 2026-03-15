import { create } from 'zustand'

interface SettingsStore {
  soundEnabled: boolean
  toggleSound: () => void
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  soundEnabled: true,
  toggleSound() {
    set(s => ({ soundEnabled: !s.soundEnabled }))
  },
}))
