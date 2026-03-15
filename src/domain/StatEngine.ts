import { StatDelta, StatState, StatType } from '../types/stat.types'
import config from '../data/config.json'

const MAX = config.stat_max as StatState
const MIN = config.stat_min as StatState
const THRESHOLDS = config.critical_thresholds as StatState

export const StatEngine = {
  apply(current: StatState, delta: StatDelta): StatState {
    const next = { ...current }
    for (const key of Object.keys(delta) as StatType[]) {
      const val = (delta[key] ?? 0)
      next[key] = Math.min(MAX[key], Math.max(MIN[key], current[key] + val))
    }
    return next
  },

  applyPassive(current: StatState, buildings: string[]): StatState {
    let next = { ...current }
    for (const building of config.buildings) {
      if (!buildings.includes(building.id)) continue
      if (building.passive) {
        next = StatEngine.apply(next, building.passive as StatDelta)
      }
    }
    return next
  },

  applyFoodConsumption(current: StatState): StatState {
    const consumed = Math.floor(current.population * config.food_per_population)
    return StatEngine.apply(current, { food: -consumed })
  },

  applyStarvation(current: StatState): StatState {
    if (current.food <= 0) {
      return StatEngine.apply(current, { population: -config.population_starvation_loss })
    }
    return current
  },

  isCritical(state: StatState, stat: StatType): boolean {
    return state[stat] <= THRESHOLDS[stat]
  },

  getGameOverReason(state: StatState): string | null {
    if (state.food <= 0)       return 'starvation'
    if (state.immunity <= 0)   return 'plague'
    if (state.defense <= 0)    return 'breach'
    if (state.population <= 0) return 'extinction'
    return null
  },

  computeRoleSynergy(roleCounts: Record<string, number>): StatDelta {
    const synergy = config.role_synergy as Record<string, { min_count: number; bonus: StatDelta }>
    const result: StatDelta = {}
    for (const [role, def] of Object.entries(synergy)) {
      const count = roleCounts[role] ?? 0
      if (count >= def.min_count) {
        for (const key of Object.keys(def.bonus) as Array<keyof StatDelta>) {
          result[key] = (result[key] ?? 0) + (def.bonus[key] ?? 0)
        }
      }
    }
    return result
  },

  clamp(state: StatState): StatState {
    const next = {} as StatState
    for (const key of Object.keys(state) as StatType[]) {
      next[key] = Math.min(MAX[key], Math.max(MIN[key], state[key]))
    }
    return next
  },
}
