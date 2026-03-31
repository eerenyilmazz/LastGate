import { StatState } from './stat.types'
import { NPC } from './npc.types'
import { GameEvent } from './event.types'

export type GamePhase =
  | 'modifier_reveal'
  | 'intro'
  | 'npc_arrival'
  | 'npc_decision'
  | 'event'
  | 'day_summary'
  | 'building'
  | 'game_over'

export type GameOverReason =
  | 'starvation'
  | 'plague'
  | 'breach'
  | 'extinction'
  | 'collapse'
  | 'victory'

export interface RunStats {
  accepted: number
  rejected: number
  queries:  number
}

export interface GameState {
  day: number
  phase: GamePhase
  activeNPC: NPC | null
  activeEvent: GameEvent | null
  queryChargesLeft: number
  queryChargesTotal: number
  acceptedNPCRoles: string[]
  acceptedRoleCounts: Record<string, number>
  runStats: RunStats
  gameOverReason: GameOverReason | null
  isGameOver: boolean
  daySpEarned: number
}

export interface ProgressState {
  sp: number
  buildings: string[]
  unlockedNPCPacks: number
  unlockedEventPacks: number
  totalRuns: number
  bestDay: number
  totalWins: number
}

export type Difficulty = 'easy' | 'normal' | 'hard'
