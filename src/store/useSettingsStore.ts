import { create } from 'zustand'
import { Difficulty } from '../types/game.types'

interface SettingsStore {
  musicEnabled: boolean
  sfxEnabled:   boolean
  difficulty: Difficulty
  toggleMusic:  () => void
  toggleSfx:    () => void
  setDifficulty: (d: Difficulty) => void
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  musicEnabled: true,
  sfxEnabled:   true,
  difficulty: 'normal',
  toggleMusic() {
    set(s => ({ musicEnabled: !s.musicEnabled }))
  },
  toggleSfx() {
    set(s => ({ sfxEnabled: !s.sfxEnabled }))
  },
  setDifficulty(d) {
    set({ difficulty: d })
  },
}))
