import { create } from 'zustand'
import { Difficulty } from '../types/game.types'

interface SettingsStore {
  musicEnabled: boolean
  sfxEnabled:   boolean
  difficulty: Difficulty
  modifiersEnabled: boolean
  toggleMusic:  () => void
  toggleSfx:    () => void
  setDifficulty: (d: Difficulty) => void
  toggleModifiers: () => void
  _load: (state: { musicEnabled?: boolean; sfxEnabled?: boolean; difficulty?: Difficulty; modifiersEnabled?: boolean }) => void
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  musicEnabled: true,
  sfxEnabled:   true,
  difficulty: 'normal',
  modifiersEnabled: true,
  toggleMusic() {
    set(s => ({ musicEnabled: !s.musicEnabled }))
  },
  toggleSfx() {
    set(s => ({ sfxEnabled: !s.sfxEnabled }))
  },
  setDifficulty(d) {
    set({ difficulty: d })
  },
  toggleModifiers() {
    set(s => ({ modifiersEnabled: !s.modifiersEnabled }))
  },
  _load(state) {
    set(s => ({ ...s, ...state }))
  },
}))
