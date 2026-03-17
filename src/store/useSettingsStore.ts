import { create } from 'zustand'
import { Difficulty } from '../types/game.types'

interface SettingsStore {
  soundEnabled: boolean
  musicEnabled: boolean
  sfxEnabled:   boolean
  difficulty: Difficulty
  toggleSound:  () => void
  toggleMusic:  () => void
  toggleSfx:    () => void
  setDifficulty: (d: Difficulty) => void
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  soundEnabled: true,
  musicEnabled: true,
  sfxEnabled:   true,
  difficulty: 'normal',
  toggleSound() {
    set(s => ({
      soundEnabled: !s.soundEnabled,
      musicEnabled: !s.soundEnabled,
      sfxEnabled:   !s.soundEnabled,
    }))
  },
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
