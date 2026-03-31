import { StatDelta } from './stat.types'

export type HiddenTrait = 'none' | 'infected' | 'liar' | 'spy' | 'thief' | 'protector'

export type NPCRole =
  | 'Doctor'
  | 'Farmer'
  | 'Soldier'
  | 'Trader'
  | 'Engineer'
  | 'Scavenger'

export interface NPCDelayedEffect {
  day: number
  [stat: string]: number
}

export interface NPC {
  npc_id: string
  name: string
  role: NPCRole
  hidden_trait: HiddenTrait
  dialogue: string
  clue_text: string
  scan_result: string
  illustration_tier: 'tier1' | 'tier2'
  illustration_key: string
  accept: StatDelta
  reject: StatDelta
  delayed_effect: NPCDelayedEffect | null
}
