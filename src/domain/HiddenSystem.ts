import { HiddenTrait } from '../types/npc.types'
import { StatDelta, StatState, StatType } from '../types/stat.types'
import { TraitHandler } from './TraitHandler'
import config from '../data/config.json'
import ui from '../data/ui.json'

export interface PendingTrait {
  npc_id: string
  trait: HiddenTrait
  accepted_day: number
}

interface TickModifiers {
  infectionReduction?: number
}

const EXPIRY = config.trait_expiry_days
const NOTIF  = ui.hidden_notifications

export const HiddenSystem = {
  enqueue(pending: PendingTrait[], npc_id: string, trait: HiddenTrait, currentDay: number): PendingTrait[] {
    if (trait === 'none' || trait === 'liar') return pending
    return [...pending, { npc_id, trait, accepted_day: currentDay }]
  },

  tick(
    pending: PendingTrait[],
    state: StatState,
    currentDay: number,
    modifiers: TickModifiers = {},
  ): { deltas: StatDelta[]; notifications: string[]; remaining: PendingTrait[] } {
    const deltas: StatDelta[] = []
    const notifications: string[] = []
    const remaining: PendingTrait[] = []
    const reduction = Math.min(modifiers.infectionReduction ?? 0, config.infection_reduction_cap)

    for (const item of pending) {
      const daysSince = currentDay - item.accepted_day
      let delta = TraitHandler.getEffect(item.trait, state, daysSince)

      if (delta && item.trait === 'infected' && reduction > 0) {
        const scaled: StatDelta = {}
        for (const [k, v] of Object.entries(delta)) {
          if (v !== undefined) {
            scaled[k as StatType] = v < 0 ? Math.ceil(v * (1 - reduction)) : v
          }
        }
        delta = scaled
      }

      if (delta) {
        deltas.push(delta)
        notifications.push(HiddenSystem.getNotificationText(item.trait, daysSince))
      }

      if (item.trait === 'spy'       && daysSince >= EXPIRY.spy)       continue
      if (item.trait === 'thief'     && daysSince >= EXPIRY.thief)     continue
      if (item.trait === 'protector' && daysSince >= EXPIRY.protector) continue
      remaining.push(item)
    }

    return { deltas, notifications, remaining }
  },

  getNotificationText(trait: HiddenTrait, days: number): string {
    if (trait === 'infected' && days === 3) return NOTIF.infected_warning
    if (trait === 'infected' && days === 5) return NOTIF.infected_crisis
    if (trait === 'infected' && days > 5)   return NOTIF.infected_spread
    if (trait === 'spy')                    return NOTIF.spy_sabotage
    if (trait === 'thief')                  return NOTIF.thief_steal
    return ''
  },
}
