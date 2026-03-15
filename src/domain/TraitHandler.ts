import { HiddenTrait } from '../types/npc.types'
import { StatDelta, StatState } from '../types/stat.types'
import config from '../data/config.json'

const FX     = config.trait_effects
const EXPIRY = config.trait_expiry_days
const PASS   = config.trait_query_pass_chance

type TraitEffect = (state: StatState, daysSinceAccepted: number) => StatDelta | null

const traitHandlers: Record<HiddenTrait, TraitEffect> = {
  infected: (_state, days) => {
    if (days === 1 || days === 2) return FX.infected_early
    if (days === 5)               return FX.infected_crisis
    if (days > 5)                 return FX.infected_late
    return null
  },

  spy: (_state, days) => {
    if (days === EXPIRY.spy) return FX.spy_sabotage
    if (days % 3 === 0)      return FX.spy_recurring
    return null
  },

  thief: (_state, days) => {
    if (days === 2)            return FX.thief_steal_minor
    if (days === EXPIRY.thief) return FX.thief_steal
    return null
  },

  liar:      () => null,
  protector: (_state, days) => days === 1 ? FX.protector_bonus : null,
  none:      () => null,
}

export const TraitHandler = {
  getEffect(trait: HiddenTrait, state: StatState, daysSinceAccepted: number): StatDelta | null {
    return traitHandlers[trait](state, daysSinceAccepted)
  },

  getLiarAcceptStats(originalAccept: StatDelta): StatDelta {
    const multiplier = config.liar_accept_multiplier
    const reduced: StatDelta = {}
    for (const key of Object.keys(originalAccept) as Array<keyof StatDelta>) {
      const val = originalAccept[key] ?? 0
      reduced[key] = val > 0 ? Math.floor(val * multiplier) : val
    }
    return reduced
  },

  queryPassChance(trait: HiddenTrait): number {
    if (trait === 'liar')     return PASS.liar
    if (trait === 'spy')      return PASS.spy
    if (trait === 'infected') return PASS.infected
    return 0
  },
}
