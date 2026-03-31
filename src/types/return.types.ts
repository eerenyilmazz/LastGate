import { StatDelta } from './stat.types'

export interface NPCReturn {
  npc_id: string
  npc_name: string
  npc_role: string
  trigger_day: number
  dialogue: string
  accept_effects: StatDelta
  reject_effects: StatDelta
  outcome_accept: string
  outcome_reject: string
}

export interface PendingDelayed {
  npc_id: string
  trigger_day: number
  effects: StatDelta
  notification: string
}

export interface FollowupData {
  npc_id: string
  delay_days: number
  dialogue: string
  accept_effects: StatDelta
  reject_effects: StatDelta
  outcome_accept: string
  outcome_reject: string
}
