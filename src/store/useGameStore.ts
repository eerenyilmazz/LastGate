import { create } from 'zustand'
import { GameState, GamePhase, GameOverReason, RunStats } from '../types/game.types'
import { NPC, NPCRole } from '../types/npc.types'
import { GameEvent } from '../types/event.types'
import { PendingTrait } from '../domain/HiddenSystem'
import { RunModifier } from '../types/modifier.types'
import { NPCReturn, PendingDelayed } from '../types/return.types'
import config from '../data/config.json'

interface GameStore extends GameState {
  pendingTraits: PendingTrait[]
  usedEventIDs: string[]
  notifications: string[]
  activeModifier: RunModifier | null
  pendingReturns: NPCReturn[]
  pendingDelayeds: PendingDelayed[]
  activeReturn: NPCReturn | null

  setPhase: (phase: GamePhase) => void
  setActiveModifier: (mod: RunModifier) => void

  setActiveNPC: (npc: NPC | null) => void
  addAcceptedRole: (role: NPCRole) => void
  consumeQueryCharge: () => { success: boolean; isFree: boolean; queryIndex: number }

  incrementRunStat: (key: keyof RunStats) => void

  setActiveEvent: (event: GameEvent | null) => void
  markEventUsed: (id: string) => void

  enqueueTrait: (trait: PendingTrait) => void
  removeTraits: (remaining: PendingTrait[]) => void

  enqueuePendingReturn: (r: NPCReturn) => void
  enqueuePendingDelayed: (d: PendingDelayed) => void
  removeReturns: (remaining: NPCReturn[]) => void
  removeDelayeds: (remaining: PendingDelayed[]) => void
  setActiveReturn: (r: NPCReturn | null) => void

  addNotification: (text: string) => void
  clearNotifications: () => void

  daySpEarned: number
  addDaySpEarned: (amount: number) => void
  resetDaySpEarned: () => void

  advanceDay: (queryCharges?: number) => void
  setQueryCharges: (n: number) => void

  setGameOver: (reason: GameOverReason) => void

  reset: () => void

  _load: (state: Partial<GameState & { pendingTraits: PendingTrait[]; usedEventIDs: string[]; pendingReturns: NPCReturn[]; pendingDelayeds: PendingDelayed[] }>) => void
}

const INITIAL: GameState & {
  pendingTraits: PendingTrait[]
  usedEventIDs: string[]
  notifications: string[]
  activeModifier: null
  pendingReturns: NPCReturn[]
  pendingDelayeds: PendingDelayed[]
  activeReturn: null
} = {
  day: 1,
  phase: 'npc_arrival',
  activeNPC: null,
  activeEvent: null,
  queryChargesLeft:  config.query_charges_per_day,
  queryChargesTotal: config.query_charges_per_day,
  acceptedNPCRoles: [],
  acceptedRoleCounts: {},
  runStats: { accepted: 0, rejected: 0, queries: 0 },
  gameOverReason: null,
  isGameOver: false,
  pendingTraits: [],
  usedEventIDs: [],
  notifications: [],
  daySpEarned: 0,
  activeModifier: null,
  pendingReturns: [],
  pendingDelayeds: [],
  activeReturn: null,
}

export const useGameStore = create<GameStore>((set, get) => ({
  ...INITIAL,

  setPhase(phase) {
    set({ phase })
  },

  setActiveModifier(mod) {
    set({ activeModifier: mod })
  },

  setActiveNPC(npc) {
    set({ activeNPC: npc })
  },

  addAcceptedRole(role) {
    set(s => ({
      acceptedNPCRoles: s.acceptedNPCRoles.includes(role)
        ? s.acceptedNPCRoles
        : [...s.acceptedNPCRoles, role],
      acceptedRoleCounts: {
        ...s.acceptedRoleCounts,
        [role]: (s.acceptedRoleCounts[role] ?? 0) + 1,
      },
    }))
  },

  incrementRunStat(key) {
    set(s => ({ runStats: { ...s.runStats, [key]: s.runStats[key] + 1 } }))
  },

  consumeQueryCharge() {
    const { queryChargesLeft, queryChargesTotal } = get()
    if (queryChargesLeft <= 0) return { success: false, isFree: false, queryIndex: -1 }
    const queryIndex = queryChargesTotal - queryChargesLeft
    const isFree     = queryIndex === 0
    set(s => ({ queryChargesLeft: s.queryChargesLeft - 1 }))
    return { success: true, isFree, queryIndex }
  },

  setActiveEvent(event) {
    set({ activeEvent: event })
  },

  markEventUsed(id) {
    set(s => ({ usedEventIDs: [...s.usedEventIDs, id] }))
  },

  enqueueTrait(trait) {
    set(s => ({ pendingTraits: [...s.pendingTraits, trait] }))
  },

  removeTraits(remaining) {
    set({ pendingTraits: remaining })
  },

  enqueuePendingReturn(r) {
    set(s => ({ pendingReturns: [...s.pendingReturns, r] }))
  },

  enqueuePendingDelayed(d) {
    set(s => ({ pendingDelayeds: [...s.pendingDelayeds, d] }))
  },

  removeReturns(remaining) {
    set({ pendingReturns: remaining })
  },

  removeDelayeds(remaining) {
    set({ pendingDelayeds: remaining })
  },

  setActiveReturn(r) {
    set({ activeReturn: r })
  },

  addNotification(text) {
    if (!text) return
    set(s => ({ notifications: [...s.notifications, text] }))
  },

  clearNotifications() {
    set({ notifications: [] })
  },

  addDaySpEarned(amount) {
    set(s => ({ daySpEarned: s.daySpEarned + amount }))
  },

  resetDaySpEarned() {
    set({ daySpEarned: 0 })
  },

  advanceDay(queryCharges = config.query_charges_per_day) {
    const { day } = get()
    set({
      day: day + 1,
      phase: 'npc_arrival',
      activeNPC: null,
      activeEvent: null,
      queryChargesLeft:  queryCharges,
      queryChargesTotal: queryCharges,
    })
  },

  setQueryCharges(n) {
    set({ queryChargesLeft: n, queryChargesTotal: n })
  },

  setGameOver(reason) {
    set({ isGameOver: true, gameOverReason: reason, phase: 'game_over' })
  },

  reset() {
    set({ ...INITIAL })
  },

  _load(state) {
    set(s => ({ ...s, ...state }))
  },
}))
