import { create } from 'zustand'
import { ProgressState } from '../types/game.types'
import { AchievementId, AchievementCheckInput, evaluateAchievements } from '../types/achievement.types'
import config from '../data/config.json'

interface ProgressStore extends ProgressState {
  achievements:    AchievementId[]
  newAchievements: AchievementId[]   // cleared after shown

  addSP:              (amount: number) => void
  spendSP:            (amount: number) => boolean
  buyBuilding:        (id: string) => boolean
  markUsed:           (id: string) => void
  hasBuilding:        (id: string) => boolean
  canUnlockBuilding:  (id: string, currentDay: number) => boolean
  updateBestRun:      (day: number, isVictory: boolean) => void
  checkAchievements:  (input: AchievementCheckInput) => void
  clearNewAchievements: () => void
  reset:              () => void
  _load:              (state: Partial<ProgressState & { achievements?: AchievementId[] }>) => void
}

const INITIAL: ProgressState = {
  sp:                 0,
  buildings:          [],
  unlockedNPCPacks:   0,
  unlockedEventPacks: 0,
  totalRuns:          0,
  bestDay:            0,
  totalWins:          0,
}

export const useProgressStore = create<ProgressStore>((set, get) => ({
  ...INITIAL,
  achievements:    [],
  newAchievements: [],

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

  updateBestRun(day, isVictory) {
    set(s => ({
      bestDay:   Math.max(s.bestDay, day),
      totalWins: isVictory ? s.totalWins + 1 : s.totalWins,
    }))
  },

  checkAchievements(input) {
    const s = get()
    const newUnlocks = evaluateAchievements(
      input,
      s.achievements,
      s.totalRuns,
      s.totalWins + (input.isVictory ? 1 : 0), // include this run's result
    )
    if (newUnlocks.length > 0) {
      set(prev => ({
        achievements:    [...prev.achievements, ...newUnlocks],
        newAchievements: [...prev.newAchievements, ...newUnlocks],
      }))
    }
  },

  clearNewAchievements() {
    set({ newAchievements: [] })
  },

  reset() {
    set(s => ({
      ...INITIAL,
      totalRuns:       s.totalRuns + 1,
      bestDay:         s.bestDay,
      totalWins:       s.totalWins,
      achievements:    s.achievements,
      newAchievements: s.newAchievements,
      sp:              s.sp,
    }))
  },

  _load(state) {
    set(s => ({
      ...INITIAL,
      ...state,
      achievements:    state.achievements    ?? s.achievements,
      newAchievements: s.newAchievements,
    }))
  },
}))
