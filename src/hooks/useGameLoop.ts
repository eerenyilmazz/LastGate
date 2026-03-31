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
import { NPC, NPCRole } from '../types/npc.types'
import { StatDelta, StatState } from '../types/stat.types'
import { GameOverReason, ProgressState, Difficulty } from '../types/game.types'
import { RunModifier } from '../types/modifier.types'
import config from '../data/config.json'
import ui from '../data/ui.json'
import modifiersData from '../data/modifiers.json'

const generator = new NPCGenerator()

const QUERY_COSTS    = config.query_costs    as Record<string, number>[]
const QUERY_VARIANCE = config.query_cost_variance as number[]

type DiffMod = { daily_food_bonus: number; starvation_extra: number; npc_neg_scale: number }
const DIFF_MODS = config.difficulty_modifiers as Record<string, DiffMod>
const DIFF_MULT: Record<string, number> = { easy: 0.3, normal: 0.0, hard: -0.25 }

const BUILDINGS = config.buildings as Array<{
  id: string
  extra_query_charge?: number
  infection_reduction?: number
}>

const CASCADE_NOTES = ui.cascade_notifications as Record<string, string>
const MODIFIERS = modifiersData as RunModifier[]

function randomiseCost(base: Record<string, number>, variance: number): Record<string, number> {
  const out: Record<string, number> = {}
  for (const [stat, val] of Object.entries(base)) {
    const swing = Math.floor(Math.random() * (variance * 2 + 1)) - variance
    out[stat] = val + swing
  }
  return out
}

function scaleDelta(delta: StatDelta, difficulty: string, modNegMult = 1): StatDelta {
  const mod = DIFF_MODS[difficulty]
  const finalScale = (mod?.npc_neg_scale ?? 1) * modNegMult
  if (finalScale === 1.0) return delta
  const result: Partial<StatDelta> = {}
  for (const [key, val] of Object.entries(delta)) {
    const v = val as number
    result[key as keyof StatDelta] = v < 0
      ? (finalScale > 1 ? Math.floor(v * finalScale) : Math.ceil(v * finalScale))
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
    const fixed = game.activeModifier?.effects.npcs_per_day_fixed
    npcsLeft.current = fixed ?? (Math.floor(
      Math.random() * (config.npcs_per_day_max - config.npcs_per_day_min + 1)
    ) + config.npcs_per_day_min)
  }

  const saveAll = useCallback(async (): Promise<void> => {
    await SaveSystem.save({
      [SaveSystem.KEYS.GAME]: {
        day:               game.day,
        phase:             game.phase,
        acceptedNPCRoles:  game.acceptedNPCRoles,
        acceptedRoleCounts:game.acceptedRoleCounts,
        pendingTraits:     game.pendingTraits,
        usedEventIDs:      game.usedEventIDs,
        queryChargesLeft:  game.queryChargesLeft,
        queryChargesTotal: game.queryChargesTotal,
        isGameOver:        game.isGameOver,
        gameOverReason:    game.gameOverReason,
        runStats:          game.runStats,
      },
      [SaveSystem.KEYS.STATS]:    stats.stats,
      [SaveSystem.KEYS.PROGRESS]: {
        sp:                 progress.sp,
        buildings:          progress.buildings,
        unlockedNPCPacks:   progress.unlockedNPCPacks,
        unlockedEventPacks: progress.unlockedEventPacks,
        totalRuns:          progress.totalRuns,
        bestDay:            progress.bestDay,
        totalWins:          progress.totalWins,
        achievements:       progress.achievements,
      },
      [SaveSystem.KEYS.NPC_QUEUE]: generator.getState(),
      [SaveSystem.KEYS.SETTINGS]: {
        musicEnabled: settings.musicEnabled,
        sfxEnabled:   settings.sfxEnabled,
        difficulty:   settings.difficulty,
      },
    })
  }, [game, stats, progress, settings])

  const applyDailyStats = useCallback(() => {
    stats.applyPassive(progress.buildings)

    const synergyDelta = StatEngine.computeRoleSynergy(game.acceptedRoleCounts)
    stats.apply(synergyDelta)

    stats.applyEconomyConversion(progress.buildings.includes('market'))
    stats.applyFoodConsumption()

    const foodMult = game.activeModifier?.effects.food_consumption_mult ?? 1
    if (foodMult !== 1) {
      const extra = Math.round(stats.stats.population * 0.04 * (foodMult - 1))
      if (extra !== 0) stats.apply({ food: -extra })
    }

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
      for (const stat of triggered) {
        if (CASCADE_NOTES[stat]) game.addNotification(CASCADE_NOTES[stat])
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
  }, [game, stats, progress, settings])

  const finishWithGameOver = useCallback(async (reason: GameOverReason, isVictory: boolean) => {
    progress.updateBestRun(game.day, isVictory)
    game.setGameOver(reason)
    progress.addSP(config.sp_rewards.game_over)
    game.addDaySpEarned(config.sp_rewards.game_over)
    progress.checkAchievements({
      day:        game.day,
      difficulty: settings.difficulty,
      runStats:   game.runStats,
      buildings:  progress.buildings,
      roleCounts: game.acceptedRoleCounts,
      isVictory,
    })
    await saveAll()
  }, [game, stats, progress, settings, saveAll])

  const tryTriggerEvent = useCallback((): boolean => {
    if (!EventManager.shouldTrigger(game.day)) return false
    const event = EventManager.pickEvent(stats.stats, game.usedEventIDs)
    if (!event) return false
    game.setActiveEvent(event)
    game.setPhase('event')
    return true
  }, [game, stats])

  const awardDaySP = useCallback((dayStartStats: StatState) => {
    progress.addSP(config.sp_rewards.day_survived)
    game.addDaySpEarned(config.sp_rewards.day_survived)

    const cur = stats.stats
    const noDrop = Object.keys(cur).every(
      k => cur[k as keyof typeof cur] >= dayStartStats[k as keyof typeof dayStartStats]
    )
    if (noDrop) {
      progress.addSP(config.sp_rewards.perfect_day)
      game.addDaySpEarned(config.sp_rewards.perfect_day)
    }
  }, [game, stats, progress])

  const advanceToNextDay = useCallback(() => {
    rollDay()
    game.advanceDay(computeQueryCharges(progress.buildings))
    game.setActiveNPC(generator.getNext())
  }, [game, progress])

  const endDay = useCallback(async () => {
    if (game.phase !== 'day_summary') return
    const dayStartStats: StatState = { ...stats.stats }
    game.clearNotifications()
    game.resetDaySpEarned()

    applyDailyStats()

    const overReason = stats.getGameOverReason()
    if (overReason) {
      await finishWithGameOver(overReason, false)
      return
    }

    if (game.day >= config.win_condition_day) {
      await finishWithGameOver('victory', true)
      return
    }

    if (tryTriggerEvent()) return

    awardDaySP(dayStartStats)
    advanceToNextDay()
    await saveAll()
  }, [game, stats, progress, applyDailyStats, finishWithGameOver, tryTriggerEvent, awardDaySP, advanceToNextDay, saveAll])

  const handleAccept = useCallback(async (npc: NPC) => {
    const rawStats = npc.hidden_trait === 'liar'
      ? TraitHandler.getLiarAcceptStats(npc.accept)
      : npc.accept

    const modNegMult = game.activeModifier?.effects.npc_neg_scale_mult ?? 1
    stats.apply(scaleDelta(rawStats as StatDelta, settings.difficulty, modNegMult))

    const roleMult = game.activeModifier?.effects.role_mult?.[npc.role] ?? 1
    if (roleMult !== 1) {
      const bonus: StatDelta = {}
      for (const [k, v] of Object.entries(rawStats as Record<string, number>)) {
        if (v > 0) bonus[k as keyof StatDelta] = Math.round(v * (roleMult - 1))
      }
      stats.apply(bonus)
    }

    game.addAcceptedRole(npc.role)
    game.incrementRunStat('accepted')

    if (npc.hidden_trait !== 'none' && npc.hidden_trait !== 'liar') {
      game.enqueueTrait({ npc_id: npc.npc_id, trait: npc.hidden_trait, accepted_day: game.day })
    }

    progress.addSP(config.sp_rewards.correct_npc_decision)
    game.addDaySpEarned(config.sp_rewards.correct_npc_decision)

    const overReason = stats.getGameOverReason()
    if (overReason) {
      await finishWithGameOver(overReason, false)
      return
    }

    npcsLeft.current -= 1
    if (npcsLeft.current > 0) {
      game.setActiveNPC(generator.getNext())
      game.setPhase('npc_decision')
    } else {
      game.setPhase('day_summary')
    }
  }, [game, stats, progress, settings, finishWithGameOver])

  const handleReject = useCallback(async (npc: NPC) => {
    const modNegMult = game.activeModifier?.effects.npc_neg_scale_mult ?? 1
    stats.apply(scaleDelta(npc.reject as StatDelta, settings.difficulty, modNegMult))
    game.incrementRunStat('rejected')

    const overReason = stats.getGameOverReason()
    if (overReason) {
      await finishWithGameOver(overReason, false)
      return
    }

    npcsLeft.current -= 1
    if (npcsLeft.current > 0) {
      game.setActiveNPC(generator.getNext())
      game.setPhase('npc_decision')
    } else {
      game.setPhase('day_summary')
    }
  }, [game, stats, settings, finishWithGameOver])

  const handleQuery = useCallback((npc: NPC): string => {
    const result = game.consumeQueryCharge()
    if (!result.success) return ui.query_messages.no_charges
    game.incrementRunStat('queries')

    const queryFree = game.activeModifier?.effects.query_free ?? false
    if (!result.isFree && !queryFree) {
      const base     = QUERY_COSTS[result.queryIndex]    ?? QUERY_COSTS[1]
      const variance = QUERY_VARIANCE[result.queryIndex] ?? 3
      stats.apply(randomiseCost(base, variance))
    }

    return result.queryIndex === 0 ? npc.clue_text : npc.scan_result
  }, [game, stats])

  const handleEventChoice = useCallback(async (choiceId: 'A' | 'B' | 'C') => {
    const event = game.activeEvent
    if (!event) return

    const choice = event.choices.find(c => c.id === choiceId)
    if (!choice) return

    const delta = EventManager.resolveChoice(choice, game.acceptedNPCRoles as NPCRole[])
    stats.apply(delta)
    game.markEventUsed(event.event_id)
    game.addNotification(choice.outcome)
    progress.addSP(config.sp_rewards.event_survived)
    game.addDaySpEarned(config.sp_rewards.event_survived)

    const overReason = stats.getGameOverReason()
    if (overReason) {
      await finishWithGameOver(overReason, false)
      return
    }

    progress.addSP(config.sp_rewards.day_survived)
    game.addDaySpEarned(config.sp_rewards.day_survived)
    advanceToNextDay()
    await saveAll()
  }, [game, stats, progress, settings, finishWithGameOver, advanceToNextDay, saveAll])

  const startGame = useCallback(() => {
    generator.reset()
    game.reset()
    stats.reset()
    progress.reset()

    const mod = MODIFIERS[Math.floor(Math.random() * MODIFIERS.length)]
    game.setActiveModifier(mod)

    const mult = DIFF_MULT[settings.difficulty] ?? 0
    if (mult !== 0) {
      const initial = config.initial_stats as Record<string, number>
      const delta: StatDelta = {}
      for (const key of Object.keys(initial)) {
        delta[key as keyof StatDelta] = Math.round(initial[key] * mult)
      }
      stats.apply(delta)
    }

    if (mod.effects.start_stat_delta) {
      stats.apply(mod.effects.start_stat_delta as StatDelta)
    }

    game.setQueryCharges(computeQueryCharges(progress.buildings))
    rollDay()
    game.setActiveNPC(generator.getNext())
    game.setPhase('modifier_reveal')
  }, [game, stats, progress, settings])

  const loadSave = useCallback(async (): Promise<{ hasResumableGame: boolean }> => {
    const savedProgress = await SaveSystem.load<ProgressState>(SaveSystem.KEYS.PROGRESS)
    if (savedProgress && typeof savedProgress === 'object') {
      progress._load(savedProgress)
    }

    const savedSettings = await SaveSystem.load<{ musicEnabled: boolean; sfxEnabled: boolean; difficulty: Difficulty }>(SaveSystem.KEYS.SETTINGS)
    if (savedSettings && typeof savedSettings === 'object') {
      settings._load(savedSettings)
    }

    const savedGame  = await SaveSystem.load<Record<string, unknown>>(SaveSystem.KEYS.GAME)
    const savedStats = await SaveSystem.load<StatState>(SaveSystem.KEYS.STATS)
    const savedQueue = await SaveSystem.load<{ queue: NPC[]; usedIDs: string[] }>(SaveSystem.KEYS.NPC_QUEUE)

    const isResumable =
      savedGame !== null &&
      typeof savedGame === 'object' &&
      savedStats !== null &&
      typeof savedStats === 'object' &&
      savedGame.isGameOver === false

    if (isResumable && savedGame && savedStats) {
      stats._setStats(savedStats)
      game._load(savedGame as Parameters<typeof game._load>[0])
      if (savedQueue) generator.loadState(savedQueue)
      return { hasResumableGame: true }
    }

    return { hasResumableGame: false }
  }, [game, stats, progress, settings])

  return { handleAccept, handleReject, handleQuery, endDay, handleEventChoice, startGame, loadSave }
}
