import { useCallback, useRef } from 'react'
import { useGameStore } from '../store/useGameStore'
import { useStatStore } from '../store/useStatStore'
import { useProgressStore } from '../store/useProgressStore'
import { useSettingsStore } from '../store/useSettingsStore'
import { NPCGenerator } from '../domain/NPCGenerator'
import { HiddenSystem } from '../domain/HiddenSystem'
import { EventManager } from '../domain/EventManager'
import { TraitHandler } from '../domain/TraitHandler'
import { StatEngine } from '../domain/StatEngine'
import { SaveSystem } from '../domain/SaveSystem'
import { NPC } from '../types/npc.types'
import { StatDelta, StatState, StatType } from '../types/stat.types'
import config from '../data/config.json'
import ui from '../data/ui.json'

const generator = new NPCGenerator()

const QUERY_COSTS    = config.query_costs as Record<string, number>[]
const QUERY_VARIANCE = config.query_cost_variance as number[]

function randomiseCost(base: Record<string, number>, variance: number): Record<string, number> {
  const out: Record<string, number> = {}
  for (const [stat, val] of Object.entries(base)) {
    const swing = Math.floor(Math.random() * (variance * 2 + 1)) - variance
    out[stat] = val + swing
  }
  return out
}

const BUILDINGS = config.buildings as Array<{
  id: string
  extra_query_charge?: number
  infection_reduction?: number
}>

// ADMOB_DISABLED — const AD_LIMITS = (config as any).ad_limits as Record<string, number>

type DiffMod = { daily_food_bonus: number; starvation_extra: number; npc_neg_scale: number }
const DIFF_MODS = (config as any).difficulty_modifiers as Record<string, DiffMod>

function scaleDelta(delta: StatDelta, difficulty: string): StatDelta {
  const mod = DIFF_MODS[difficulty]
  if (!mod || mod.npc_neg_scale === 1.0) return delta
  const result: Partial<StatDelta> = {}
  for (const [key, val] of Object.entries(delta)) {
    const v = val as number
    result[key as keyof StatDelta] = v < 0
      ? (mod.npc_neg_scale > 1 ? Math.floor(v * mod.npc_neg_scale) : Math.ceil(v * mod.npc_neg_scale))
      : v
  }
  return result as StatDelta
}

function computeQueryCharges(ownedBuildings: string[]): number {
  return BUILDINGS
    .filter(b => ownedBuildings.includes(b.id) && b.extra_query_charge)
    .reduce((sum, b) => sum + (b.extra_query_charge ?? 0), config.query_charges_per_day)
}

function computeInfectionReduction(ownedBuildings: string[]): number {
  const total = BUILDINGS
    .filter(b => ownedBuildings.includes(b.id) && b.infection_reduction)
    .reduce((sum, b) => sum + (b.infection_reduction ?? 0), 0)
  return Math.min(total, config.infection_reduction_cap)
}

export const useGameLoop = () => {
  const game     = useGameStore()
  const stats    = useStatStore()
  const progress = useProgressStore()
  const settings = useSettingsStore()

  const npcsLeft = useRef(1)
  const rollDay  = () => {
    npcsLeft.current = Math.floor(
      Math.random() * (config.npcs_per_day_max - config.npcs_per_day_min + 1)
    ) + config.npcs_per_day_min
  }

  const endDay = useCallback(() => {
    const dayStartStats: StatState = { ...stats.stats }

    game.resetDaySpEarned()

    stats.applyPassive(progress.buildings)

    const synergyDelta = StatEngine.computeRoleSynergy(game.acceptedRoleCounts)
    stats.apply(synergyDelta)

    stats.applyEconomyConversion(progress.buildings.includes('market'))

    stats.applyFoodConsumption()

    const diffMod = DIFF_MODS[settings.difficulty]
    if (diffMod?.daily_food_bonus !== 0) {
      stats.apply({ food: diffMod.daily_food_bonus })
    }

    stats.applyStarvation()

    if (diffMod?.starvation_extra > 0 && stats.stats.food <= 0) {
      stats.apply({ population: -diffMod.starvation_extra })
    }

    const { next: cascaded, triggered } = StatEngine.applyCascade(stats.stats)
    if (triggered.length > 0) {
      stats._setStats(cascaded)
      const cascadeNotes = (ui as any).cascade_notifications as Record<string, string>
      for (const stat of triggered) {
        if (cascadeNotes[stat]) game.addNotification(cascadeNotes[stat])
      }
    }

    const infectionReduction = computeInfectionReduction(progress.buildings)
    const { deltas, notifications, remaining } = HiddenSystem.tick(
      game.pendingTraits,
      stats.stats,
      game.day,
      { infectionReduction },
    )
    for (const delta of deltas) stats.apply(delta)
    for (const note of notifications) game.addNotification(note)
    game.removeTraits(remaining)

    const reason = stats.getGameOverReason()
    if (reason) {
      progress.updateBestRun(game.day, false)
      game.setGameOver(reason as any)
      progress.addSP(config.sp_rewards.game_over)
      game.addDaySpEarned(config.sp_rewards.game_over)
      saveAll()
      return
    }

    if (game.day >= config.win_condition_day) {
      progress.updateBestRun(game.day, true)
      game.setGameOver('victory' as any)
      progress.addSP(config.sp_rewards.game_over)
      game.addDaySpEarned(config.sp_rewards.game_over)
      saveAll()
      return
    }

    if (EventManager.shouldTrigger(game.day)) {
      const event = EventManager.pickEvent(stats.stats, game.usedEventIDs)
      if (event) {
        game.setActiveEvent(event)
        game.setPhase('event')
        return
      }
    }

    progress.addSP(config.sp_rewards.day_survived)
    game.addDaySpEarned(config.sp_rewards.day_survived)

    const cur    = stats.stats
    const noDrop = Object.keys(cur).every(k => cur[k as keyof typeof cur] >= dayStartStats[k as keyof typeof dayStartStats])
    if (noDrop) {
      progress.addSP(config.sp_rewards.perfect_day)
      game.addDaySpEarned(config.sp_rewards.perfect_day)
    }

    rollDay()
    game.advanceDay(computeQueryCharges(progress.buildings))
    const nextNPC = generator.getNext()
    game.setActiveNPC(nextNPC)

    saveAll()
  }, [game, stats, progress])

  const handleAccept = useCallback((npc: NPC) => {
    const rawStats = npc.hidden_trait === 'liar'
      ? TraitHandler.getLiarAcceptStats(npc.accept)
      : npc.accept

    const effectiveStats = scaleDelta(rawStats as StatDelta, settings.difficulty)
    stats.apply(effectiveStats as StatDelta)
    game.addAcceptedRole(npc.role)
    game.incrementRunStat('accepted')

    if (npc.hidden_trait !== 'none' && npc.hidden_trait !== 'liar') {
      game.enqueueTrait({ npc_id: npc.npc_id, trait: npc.hidden_trait, accepted_day: game.day })
    }

    progress.addSP(config.sp_rewards.correct_npc_decision)
    game.addDaySpEarned(config.sp_rewards.correct_npc_decision)

    const overReason = stats.getGameOverReason()
    if (overReason) {
      // ADMOB_DISABLED — ad rescue flow commented out, goes directly to game over
      // const adLimit = AD_LIMITS[settings.difficulty] ?? 0
      // if (game.adsWatchedThisRun < adLimit) { game.setPendingAdReason(overReason) } else { ... }
      progress.updateBestRun(game.day, false)
      game.setGameOver(overReason as any)
      progress.addSP(config.sp_rewards.game_over)
      game.addDaySpEarned(config.sp_rewards.game_over)
      saveAll()
      return
    }

    npcsLeft.current -= 1
    if (npcsLeft.current > 0) {
      const nextNPC = generator.getNext()
      game.setActiveNPC(nextNPC)
      game.setPhase('npc_decision')
    } else {
      game.setPhase('day_summary')
    }
  }, [game, stats, progress, endDay, settings.difficulty])

  const handleReject = useCallback((npc: NPC) => {
    stats.apply(scaleDelta(npc.reject as StatDelta, settings.difficulty))
    game.incrementRunStat('rejected')

    const overReason = stats.getGameOverReason()
    if (overReason) {
      // ADMOB_DISABLED — ad rescue flow commented out, goes directly to game over
      // const adLimit = AD_LIMITS[settings.difficulty] ?? 0
      // if (game.adsWatchedThisRun < adLimit) { game.setPendingAdReason(overReason) } else { ... }
      progress.updateBestRun(game.day, false)
      game.setGameOver(overReason as any)
      progress.addSP(config.sp_rewards.game_over)
      saveAll()
      return
    }

    npcsLeft.current -= 1
    if (npcsLeft.current > 0) {
      const nextNPC = generator.getNext()
      game.setActiveNPC(nextNPC)
      game.setPhase('npc_decision')
    } else {
      game.setPhase('day_summary')
    }
  }, [game, stats, progress, endDay, settings.difficulty])

  const handleQuery = useCallback((npc: NPC): string => {
    const result = game.consumeQueryCharge()
    if (!result.success) return ui.query_messages.no_charges
    game.incrementRunStat('queries')

    if (!result.isFree) {
      const base     = QUERY_COSTS[result.queryIndex]    ?? QUERY_COSTS[1]
      const variance = QUERY_VARIANCE[result.queryIndex] ?? 3
      stats.apply(randomiseCost(base, variance))
    }

    if (result.queryIndex === 0) {
      return npc.clue_text
    }

    return npc.scan_result
  }, [game, stats])

  const handleEventChoice = useCallback((choiceId: 'A' | 'B' | 'C') => {
    const event = game.activeEvent
    if (!event) return

    const choice = event.choices.find(c => c.id === choiceId)
    if (!choice) return

    const delta = EventManager.resolveChoice(choice, game.acceptedNPCRoles as any)
    stats.apply(delta)
    game.markEventUsed(event.event_id)
    game.addNotification(choice.outcome)
    progress.addSP(config.sp_rewards.event_survived)
    game.addDaySpEarned(config.sp_rewards.event_survived)

    const overReason = stats.getGameOverReason()
    if (overReason) {
      game.setGameOver(overReason as any)
      progress.addSP(config.sp_rewards.game_over)
      game.addDaySpEarned(config.sp_rewards.game_over)
      saveAll()
      return
    }

    progress.addSP(config.sp_rewards.day_survived)
    game.addDaySpEarned(config.sp_rewards.day_survived)
    rollDay()
    game.advanceDay(computeQueryCharges(progress.buildings))
    const nextNPC = generator.getNext()
    game.setActiveNPC(nextNPC)

    saveAll()
  }, [game, stats, progress, settings.difficulty])

  const DIFF_MULT: Record<string, number> = { easy: 0.3, normal: 0.0, hard: -0.25 }

  const startGame = useCallback(() => {
    generator.reset()
    game.reset()
    stats.reset()
    progress.reset()

    const mult = DIFF_MULT[settings.difficulty] ?? 0
    if (mult !== 0) {
      const initial = config.initial_stats as Record<string, number>
      const delta: Record<string, number> = {}
      for (const key of Object.keys(initial)) {
        delta[key] = Math.round(initial[key] * mult)
      }
      stats.apply(delta as any)
    }

    game.setQueryCharges(computeQueryCharges(progress.buildings))
    rollDay()
    const firstNPC = generator.getNext()
    game.setActiveNPC(firstNPC)
    game.setPhase('intro')
  }, [game, stats, progress, settings.difficulty])

  const saveAll = useCallback(async () => {
    await SaveSystem.save({
      [SaveSystem.KEYS.GAME]: {
        day: game.day,
        phase: game.phase,
        acceptedNPCRoles: game.acceptedNPCRoles,
        pendingTraits: game.pendingTraits,
        usedEventIDs: game.usedEventIDs,
        queryChargesLeft:  game.queryChargesLeft,
        queryChargesTotal: game.queryChargesTotal,
        isGameOver: game.isGameOver,
        gameOverReason: game.gameOverReason,
      },
      [SaveSystem.KEYS.STATS]: stats.stats,
      [SaveSystem.KEYS.PROGRESS]: {
        sp: progress.sp,
        buildings: progress.buildings,
        unlockedNPCPacks: progress.unlockedNPCPacks,
        unlockedEventPacks: progress.unlockedEventPacks,
        totalRuns: progress.totalRuns,
        bestDay: progress.bestDay,
        totalWins: progress.totalWins,
      },
      [SaveSystem.KEYS.NPC_QUEUE]: generator.getState(),
    })
  }, [game, stats, progress])

  return { handleAccept, handleReject, handleQuery, endDay, handleEventChoice, startGame }
}
