import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Difficulty } from '../types/game.types'

const SETTINGS_KEY = 'lastgate_settings'

async function persist(state: object) {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(state))
  } catch {}
}

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

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  musicEnabled: true,
  sfxEnabled:   true,
  difficulty: 'normal',
  modifiersEnabled: true,
  toggleMusic() {
    set(s => {
      const next = { ...s, musicEnabled: !s.musicEnabled }
      persist({ musicEnabled: next.musicEnabled, sfxEnabled: next.sfxEnabled, difficulty: next.difficulty, modifiersEnabled: next.modifiersEnabled })
      return { musicEnabled: next.musicEnabled }
    })
  },
  toggleSfx() {
    set(s => {
      const next = { ...s, sfxEnabled: !s.sfxEnabled }
      persist({ musicEnabled: next.musicEnabled, sfxEnabled: next.sfxEnabled, difficulty: next.difficulty, modifiersEnabled: next.modifiersEnabled })
      return { sfxEnabled: next.sfxEnabled }
    })
  },
  setDifficulty(d) {
    set(s => {
      persist({ musicEnabled: s.musicEnabled, sfxEnabled: s.sfxEnabled, difficulty: d, modifiersEnabled: s.modifiersEnabled })
      return { difficulty: d }
    })
  },
  toggleModifiers() {
    set(s => {
      const next = { ...s, modifiersEnabled: !s.modifiersEnabled }
      persist({ musicEnabled: next.musicEnabled, sfxEnabled: next.sfxEnabled, difficulty: next.difficulty, modifiersEnabled: next.modifiersEnabled })
      return { modifiersEnabled: next.modifiersEnabled }
    })
  },
  _load(state) {
    set(s => ({ ...s, ...state }))
  },
}))
