import { create } from 'zustand'
import { ProgressState } from '../types/game.types'
import config from '../data/config.json'

interface ProgressStore extends ProgressState {
  addSP: (amount: number) => void
  spendSP: (amount: number) => boolean
  buyBuilding: (id: string) => boolean
  markUsed: (id: string) => void        // SP ödemeden "satın alındı" işaretle (yetenekler için)
  hasBuilding: (id: string) => boolean
  canUnlockBuilding: (id: string, currentDay: number) => boolean
  reset: () => void
  _load: (state: ProgressState) => void
}

const INITIAL: ProgressState = {
  sp: 0,
  buildings: [],
  unlockedNPCPacks: 0,
  unlockedEventPacks: 0,
  totalRuns: 0,
}

export const useProgressStore = create<ProgressStore>((set, get) => ({
  ...INITIAL,

  addSP(amount) {
    set(s => ({ sp: s.sp + amount }))
  },

  spendSP(amount) {
    if (get().sp < amount) return false
    set(s => ({ sp: s.sp - amount }))
    return true
  },

  buyBuilding(id) {
    const building = config.buildings.find(b => b.id === id)
    if (!building) return false
    if (get().buildings.includes(id)) return false
    if (!get().spendSP(building.cost)) return false
    set(s => ({ buildings: [...s.buildings, id] }))
    return true
  },

  markUsed(id) {
    if (get().buildings.includes(id)) return
    set(s => ({ buildings: [...s.buildings, id] }))
  },

  hasBuilding(id) {
    return get().buildings.includes(id)
  },

  canUnlockBuilding(id, currentDay) {
    const building = config.buildings.find(b => b.id === id)
    if (!building) return false
    return currentDay >= building.unlock_day && !get().buildings.includes(id)
  },

  reset() {
    set(s => ({ ...INITIAL, totalRuns: s.totalRuns + 1 }))
  },

  _load(state) {
    set(state)
  },
}))
