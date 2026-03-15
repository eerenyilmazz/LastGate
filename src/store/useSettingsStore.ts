import { create } from 'zustand'
import { Difficulty } from '../types/game.types'

interface SettingsStore {
  soundEnabled: boolean
  difficulty: Difficulty
  toggleSound: () => void
  setDifficulty: (d: Difficulty) => void
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  soundEnabled: true,
  difficulty: 'normal',
  toggleSound() {
    set(s => ({ soundEnabled: !s.soundEnabled }))
  },
  setDifficulty(d) {
    set({ difficulty: d })
  },
}))
