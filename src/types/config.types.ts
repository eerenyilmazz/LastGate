import { StatState, StatDelta } from './stat.types'

export interface BuildingConfig {
  id: string
  label: string
  description: string
  cost: number
  unlock_day: number
  passive?: StatDelta
  infection_reduction?: number
  crisis_reduction?: number
  extra_query_charge?: number
  infection_detect_bonus?: number
  plague_duration_reduction?: number
  trade_event_bonus?: number
}

export interface SPRewards {
  day_survived: number
  correct_npc_decision: number
  event_survived: number
  perfect_day: number
  game_over: number
}

export interface GameConfig {
  initial_stats: StatState
  critical_thresholds: StatState
  event_trigger_chance: number
  query_charges_per_day: number
  win_condition_days: Record<string, number>
  sp_rewards: SPRewards
  buildings: BuildingConfig[]
}
