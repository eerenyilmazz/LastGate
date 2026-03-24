import { StatDelta, StatState, StatType } from '../types/stat.types'
import { GameOverReason } from '../types/game.types'
import config from '../data/config.json'

const MAX        = config.stat_max            as StatState
const MIN        = config.stat_min            as StatState
const THRESHOLDS = config.critical_thresholds as StatState

const CASCADE_EFFECTS          = config.cascade_effects          as Record<string, Record<string, number>>
const ECONOMY_FOOD_RATE: number = (config as { economy_food_conversion_rate?: number }).economy_food_conversion_rate ?? 0.05
const ROLE_SYNERGY              = config.role_synergy             as Record<string, { min_count: number; bonus: StatDelta }>

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

  applyEconomyConversion(current: StatState, hasMarket: boolean): StatState {
    if (!hasMarket) return current
    const foodBonus = Math.floor(current.economy * ECONOMY_FOOD_RATE)
    if (foodBonus <= 0) return current
    return StatEngine.apply(current, { food: foodBonus })
  },

  isCritical(state: StatState, stat: StatType): boolean {
    return state[stat] <= THRESHOLDS[stat]
  },

  applyCascade(current: StatState): { next: StatState; triggered: StatType[] } {
    let next = { ...current }
    const triggered: StatType[] = []
    for (const stat of Object.keys(CASCADE_EFFECTS) as StatType[]) {
      if (current[stat] <= THRESHOLDS[stat]) {
        next = StatEngine.apply(next, CASCADE_EFFECTS[stat] as StatDelta)
        triggered.push(stat)
      }
    }
    return { next, triggered }
  },

  getGameOverReason(state: StatState): GameOverReason | null {
    if (state.food <= 0)       return 'starvation'
    if (state.immunity <= 0)   return 'plague'
    if (state.defense <= 0)    return 'breach'
    if (state.population <= 0) return 'extinction'
    if (state.economy <= 0)    return 'collapse'
    return null
  },

  computeRoleSynergy(roleCounts: Record<string, number>): StatDelta {
    const result: StatDelta = {}
    for (const [role, def] of Object.entries(ROLE_SYNERGY)) {
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
