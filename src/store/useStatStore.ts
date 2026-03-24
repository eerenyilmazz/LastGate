import { create } from 'zustand'
import { StatState, StatDelta, StatType } from '../types/stat.types'
import { StatEngine } from '../domain/StatEngine'
import config from '../data/config.json'

interface StatStore {
  stats: StatState
  prevStats: StatState
  apply: (delta: StatDelta) => void
  applyPassive: (buildings: string[]) => void
  applyFoodConsumption: () => void
  applyStarvation: () => void
  applyEconomyConversion: (hasMarket: boolean) => void
  isCritical: (stat: StatType) => boolean
  getGameOverReason: () => string | null
  reset: () => void
  _setStats: (stats: StatState) => void
}

const INITIAL = config.initial_stats as StatState

export const useStatStore = create<StatStore>((set, get) => ({
  stats: { ...INITIAL },
  prevStats: { ...INITIAL },

  apply(delta) {
    set(s => ({
      prevStats: { ...s.stats },
      stats: StatEngine.apply(s.stats, delta),
    }))
  },

  applyPassive(buildings) {
    set(s => ({
      prevStats: { ...s.stats },
      stats: StatEngine.applyPassive(s.stats, buildings),
    }))
  },

  applyFoodConsumption() {
    set(s => ({
      prevStats: { ...s.stats },
      stats: StatEngine.applyFoodConsumption(s.stats),
    }))
  },

  applyStarvation() {
    set(s => ({
      prevStats: { ...s.stats },
      stats: StatEngine.applyStarvation(s.stats),
    }))
  },

  applyEconomyConversion(hasMarket) {
    set(s => ({
      prevStats: { ...s.stats },
      stats: StatEngine.applyEconomyConversion(s.stats, hasMarket),
    }))
  },

  isCritical(stat) {
    return StatEngine.isCritical(get().stats, stat)
  },

  getGameOverReason() {
    return StatEngine.getGameOverReason(get().stats)  // GameOverReason | null
  },

  reset() {
    set({ stats: { ...INITIAL }, prevStats: { ...INITIAL } })
  },

  _setStats(stats) {
    set({ stats, prevStats: stats })
  },
}))
