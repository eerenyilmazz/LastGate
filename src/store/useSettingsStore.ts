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
  selectedModifierId: string | null
  toggleMusic:  () => void
  toggleSfx:    () => void
  setDifficulty: (d: Difficulty) => void
  toggleModifiers: () => void
  setSelectedModifier: (id: string | null) => void
  _load: (state: { musicEnabled?: boolean; sfxEnabled?: boolean; difficulty?: Difficulty; modifiersEnabled?: boolean; selectedModifierId?: string | null }) => void
}

function persistAll(s: SettingsStore) {
  persist({
    musicEnabled:       s.musicEnabled,
    sfxEnabled:         s.sfxEnabled,
    difficulty:         s.difficulty,
    modifiersEnabled:   s.modifiersEnabled,
    selectedModifierId: s.selectedModifierId,
  })
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  musicEnabled: true,
  sfxEnabled:   true,
  difficulty: 'normal',
  modifiersEnabled: false,
  selectedModifierId: null,
  toggleMusic() {
    set(s => {
      const next = { ...s, musicEnabled: !s.musicEnabled }
      persistAll(next)
      return { musicEnabled: next.musicEnabled }
    })
  },
  toggleSfx() {
    set(s => {
      const next = { ...s, sfxEnabled: !s.sfxEnabled }
      persistAll(next)
      return { sfxEnabled: next.sfxEnabled }
    })
  },
  setDifficulty(d) {
    set(s => {
      const next = { ...s, difficulty: d }
      persistAll(next)
      return { difficulty: d }
    })
  },
  toggleModifiers() {
    set(s => {
      const next = { ...s, modifiersEnabled: !s.modifiersEnabled }
      persistAll(next)
      return { modifiersEnabled: next.modifiersEnabled }
    })
  },
  setSelectedModifier(id) {
    set(s => {
      const next = { ...s, selectedModifierId: id }
      persistAll(next)
      return { selectedModifierId: id }
    })
  },
  _load(state) {
    set(s => ({ ...s, ...state }))
  },
}))
