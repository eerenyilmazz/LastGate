import { StatDelta, StatType } from './stat.types'
import { NPCRole } from './npc.types'

export interface EventChoice {
  id: 'A' | 'B' | 'C'
  label: string
  requires_role: NPCRole | null
  role_bonus: StatDelta | null
  effects: StatDelta
  outcome: string
}

export interface TriggerCondition {
  stat: StatType
  below: number
}

export interface GameEvent {
  event_id: string
  category: string
  title: string
  description: string
  weight: number
  trigger_condition: TriggerCondition | null
  choices: [EventChoice, EventChoice, EventChoice]
}
