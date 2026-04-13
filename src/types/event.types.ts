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
  requires_event?: string    // zincir olaylar: bu event_id görülmeden tetiklenme
  is_dilemma?: boolean       // baskı olayı: her N günde bir zorla tetiklenir
  choices: [EventChoice, EventChoice, EventChoice]
}
