import { GameEvent, EventChoice } from '../types/event.types'
import { StatState, StatDelta } from '../types/stat.types'
import { NPCRole } from '../types/npc.types'
import rawEvents from '../data/events.json'
import config from '../data/config.json'

const ALL_EVENTS: GameEvent[] = (rawEvents as any).events as GameEvent[]

export const EventManager = {
  shouldTrigger(day: number): boolean {
    const chance = day >= config.late_game_day
      ? config.event_trigger_chance_late
      : config.event_trigger_chance
    return Math.random() < chance
  },

  pickEvent(state: StatState, usedEventIDs: string[]): GameEvent | null {
    const available = ALL_EVENTS.filter(e => {
      if (usedEventIDs.includes(e.event_id)) return false
      if (!e.trigger_condition) return true
      const { stat, below } = e.trigger_condition
      return state[stat] <= below
    })

    if (available.length === 0) return null

    const totalWeight = available.reduce((sum, e) => sum + e.weight, 0)
    let random = Math.random() * totalWeight

    for (const event of available) {
      random -= event.weight
      if (random <= 0) return event
    }

    return available[available.length - 1]
  },

  resolveChoice(
    choice: EventChoice,
    acceptedRoles: NPCRole[]
  ): StatDelta {
    const base = { ...choice.effects }

    if (
      choice.requires_role &&
      choice.role_bonus &&
      acceptedRoles.includes(choice.requires_role)
    ) {
      for (const key of Object.keys(choice.role_bonus) as Array<keyof StatDelta>) {
        base[key] = (base[key] ?? 0) + (choice.role_bonus[key] ?? 0)
      }
    }

    return base
  },
}
