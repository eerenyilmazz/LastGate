import { useCallback, useRef } from 'react'
import { useGameStore } from '../store/useGameStore'
import { useStatStore } from '../store/useStatStore'
import { useProgressStore } from '../store/useProgressStore'
import { useSettingsStore } from '../store/useSettingsStore'
import { NPCGenerator } from '../domain/NPCGenerator'
import { HiddenSystem } from '../domain/HiddenSystem'
import { ReturnSystem } from '../domain/ReturnSystem'
import { EventManager } from '../domain/EventManager'
import { TraitHandler } from '../domain/TraitHandler'
import { StatEngine } from '../domain/StatEngine'
import { SaveSystem } from '../domain/SaveSystem'
import { NPC, NPCRole } from '../types/npc.types'
import { StatDelta, StatState } from '../types/stat.types'
import { GameOverReason, ProgressState, Difficulty, Disaster } from '../types/game.types'
import { RunModifier } from '../types/modifier.types'
import { FollowupData } from '../types/return.types'
import config from '../data/config.json'
import ui from '../data/ui.json'
import modifiersData from '../data/modifiers.json'
import followupsData from '../data/followups.json'
import disastersData from '../data/disasters.json'

const FOLLOWUPS = followupsData as FollowupData[]

const generator = new NPCGenerator()

const QUERY_COSTS    = config.query_costs    as Record<string, number>[]
const QUERY_VARIANCE = config.query_cost_variance as number[]

type DiffMod = { daily_food_bonus: number; starvation_extra: number; npc_neg_scale: number }
const DIFF_MODS = config.difficulty_modifiers as Record<string, DiffMod>
const DIFF_MULT = config.difficulty_start_multipliers as Record<string, number>

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
        pendingReturns:    game.pendingReturns,
        pendingDelayeds:   game.pendingDelayeds,
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
        musicEnabled:     settings.musicEnabled,
        sfxEnabled:       settings.sfxEnabled,
        difficulty:       settings.difficulty,
        modifiersEnabled: settings.modifiersEnabled,
      },
    })
  }, [game, stats, progress, settings])

  const applyDailyStats = useCallback((): { hasReturn: boolean; hasDisaster: boolean } => {
    stats.applyPassive(progress.buildings)

    const synergyDelta = StatEngine.computeRoleSynergy(game.acceptedRoleCounts)
    stats.apply(synergyDelta)

    stats.applyEconomyConversion(progress.buildings.includes('market'))
    stats.applyFoodConsumption()

    const foodMult = game.activeModifier?.effects.food_consumption_mult ?? 1
    if (foodMult !== 1) {
      const extra = Math.round(stats.stats.population * config.food_consumption_rate * (foodMult - 1))
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

    const { deltas: dDeltas, notifications: dNotes, remaining: dRemain } =
      ReturnSystem.tickDelayed(game.pendingDelayeds, game.day)
    for (const d of dDeltas) stats.apply(d)
    for (const n of dNotes) game.addNotification(n)
    game.removeDelayeds(dRemain)

    const { triggered: returnTriggered, remaining: rRemain } =
      ReturnSystem.tickReturns(game.pendingReturns, game.day)
    game.removeReturns(rRemain)
    if (returnTriggered) {
      game.setActiveReturn(returnTriggered)
      return { hasReturn: true, hasDisaster: false }
    }

    const daysSinceLast = game.day - game.lastDisasterDay
    if (game.day >= 5 && daysSinceLast >= 6 && Math.random() < 0.18) {
      const eligible = (disastersData as unknown as Disaster[]).filter(d => game.day >= d.min_day)
      if (eligible.length > 0) {
        const totalW = eligible.reduce((s, d) => s + d.weight, 0)
        let r = Math.random() * totalW
        const picked = eligible.find(d => { r -= d.weight; return r <= 0 }) ?? eligible[0]
        stats.apply(picked.effects as StatDelta)
        game.setActiveDisaster(picked)
        game.setLastDisasterDay(game.day)
        return { hasReturn: false, hasDisaster: true }
      }
    }

    return { hasReturn: false, hasDisaster: false }
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

  const triggerRescueOrGameOver = useCallback(async (reason: GameOverReason) => {
    game.setPendingRescue(reason)
  }, [game])

  const handleRescue = useCallback(async () => {
    const reason = game.pendingRescueReason
    if (!reason) return

    const RESCUE_STATS: Record<string, Partial<Record<string, number>>> = {
      starvation: { food:       25 },
      plague:     { immunity:   20 },
      breach:     { defense:    20 },
      extinction: { population: 15 },
      collapse:   { economy:    20 },
    }

    stats.apply(RESCUE_STATS[reason] as any)
    game.setPendingRescue(null)
    game.setPhase('day_summary')
    await saveAll()
  }, [game, stats, saveAll])

  const handleRescueGiveUp = useCallback(async () => {
    const reason = game.pendingRescueReason
    game.setPendingRescue(null)
    if (reason) await finishWithGameOver(reason, false)
  }, [game, finishWithGameOver])

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

  const dayStartStatsRef = useRef<StatState>({ immunity: 0, food: 0, population: 0, defense: 0, economy: 0 })

  const continueAfterModifier = useCallback(async () => {
    const overReason = stats.getGameOverReason()
    if (overReason) { await triggerRescueOrGameOver(overReason); return }
    if (game.day >= config.win_condition_days[settings.difficulty]) { await finishWithGameOver('victory', true); return }
    if (tryTriggerEvent()) return
    awardDaySP(dayStartStatsRef.current)
    advanceToNextDay()
    await saveAll()
  }, [game, stats, finishWithGameOver, tryTriggerEvent, awardDaySP, advanceToNextDay, saveAll])

  const endDay = useCallback(async () => {
    if (game.phase !== 'day_summary') return
    dayStartStatsRef.current = { ...stats.stats }
    game.clearNotifications()
    game.resetDaySpEarned()

    const { hasReturn, hasDisaster } = applyDailyStats()

    const overReason = stats.getGameOverReason()
    if (overReason) {
      await triggerRescueOrGameOver(overReason)
      return
    }

    if (hasDisaster) {
      game.setPhase('disaster')
      await saveAll()
      return
    }

    if (hasReturn) {
      game.setPhase('npc_return')
      await saveAll()
      return
    }

    if (game.day >= config.win_condition_days[settings.difficulty]) {
      await finishWithGameOver('victory', true)
      return
    }

    if (game.day === 1 && settings.modifiersEnabled && game.activeModifier) {
      game.setPhase('modifier_reveal')
      await saveAll()
      return
    }

    if (tryTriggerEvent()) return

    awardDaySP(dayStartStatsRef.current)
    advanceToNextDay()
    await saveAll()
  }, [game, stats, progress, settings, applyDailyStats, finishWithGameOver, tryTriggerEvent, awardDaySP, advanceToNextDay, saveAll])

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

    const delayed = ReturnSystem.enqueueDelayed(npc, game.day)
    if (delayed) game.enqueuePendingDelayed(delayed)

    const followup = FOLLOWUPS.find(f => f.npc_id === npc.npc_id)
    if (followup) game.enqueuePendingReturn(ReturnSystem.enqueueReturn(followup, npc, game.day))

    progress.addSP(config.sp_rewards.correct_npc_decision)
    game.addDaySpEarned(config.sp_rewards.correct_npc_decision)

    const overReason = stats.getGameOverReason()
    if (overReason) {
      await triggerRescueOrGameOver(overReason)
      return
    }

    npcsLeft.current -= 1
    if (npcsLeft.current > 0) {
      game.setActiveNPC(generator.getNext())
      game.setPhase('npc_decision')
    } else {
      game.setPhase('day_summary')
    }
  }, [game, stats, progress, settings, triggerRescueOrGameOver])

  const handleReject = useCallback(async (npc: NPC) => {
    const modNegMult = game.activeModifier?.effects.npc_neg_scale_mult ?? 1
    stats.apply(scaleDelta(npc.reject as StatDelta, settings.difficulty, modNegMult))
    game.incrementRunStat('rejected')

    const overReason = stats.getGameOverReason()
    if (overReason) {
      await triggerRescueOrGameOver(overReason)
      return
    }

    npcsLeft.current -= 1
    if (npcsLeft.current > 0) {
      game.setActiveNPC(generator.getNext())
      game.setPhase('npc_decision')
    } else {
      game.setPhase('day_summary')
    }
  }, [game, stats, settings, triggerRescueOrGameOver])

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

  const handleReturn = useCallback(async (choice: 'accept' | 'reject') => {
    const ret = game.activeReturn
    if (!ret) return
    const effects = choice === 'accept' ? ret.accept_effects : ret.reject_effects
    const outcome = choice === 'accept' ? ret.outcome_accept : ret.outcome_reject
    stats.apply(effects as StatDelta)
    game.addNotification(outcome)
    game.setActiveReturn(null)

    const overReason = stats.getGameOverReason()
    if (overReason) {
      await triggerRescueOrGameOver(overReason)
      return
    }

    if (game.day >= config.win_condition_days[settings.difficulty]) {
      await finishWithGameOver('victory', true)
      return
    }

    if (tryTriggerEvent()) return

    awardDaySP(dayStartStatsRef.current)
    advanceToNextDay()
    await saveAll()
  }, [game, stats, progress, finishWithGameOver, triggerRescueOrGameOver, tryTriggerEvent, awardDaySP, advanceToNextDay, saveAll])

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
      await triggerRescueOrGameOver(overReason)
      return
    }

    progress.addSP(config.sp_rewards.day_survived)
    game.addDaySpEarned(config.sp_rewards.day_survived)
    advanceToNextDay()
    await saveAll()
  }, [game, stats, progress, settings, finishWithGameOver, triggerRescueOrGameOver, advanceToNextDay, saveAll])

  const startGame = useCallback(() => {
    generator.reset()
    game.reset()
    stats.reset()
    progress.reset()

    const mult = DIFF_MULT[settings.difficulty] ?? 0
    if (mult !== 0) {
      const initial = config.initial_stats as Record<string, number>
      const delta: StatDelta = {}
      for (const key of Object.keys(initial)) {
        delta[key as keyof StatDelta] = Math.round(initial[key] * mult)
      }
      stats.apply(delta)
    }

    if (settings.modifiersEnabled) {
      const mod = MODIFIERS[Math.floor(Math.random() * MODIFIERS.length)]
      game.setActiveModifier(mod)
      if (mod.effects.start_stat_delta) {
        stats.apply(mod.effects.start_stat_delta as StatDelta)
      }
    }

    game.setQueryCharges(computeQueryCharges(progress.buildings))
    rollDay()
    game.setActiveNPC(generator.getNext())
    game.setPhase('intro')
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

  const handleDisasterContinue = useCallback(async () => {
    game.setActiveDisaster(null)

    const overReason = stats.getGameOverReason()
    if (overReason) {
      await triggerRescueOrGameOver(overReason)
      return
    }

    if (game.day >= config.win_condition_days[settings.difficulty]) {
      await finishWithGameOver('victory', true)
      return
    }

    if (tryTriggerEvent()) return

    awardDaySP(dayStartStatsRef.current)
    advanceToNextDay()
    await saveAll()
  }, [game, stats, settings, finishWithGameOver, triggerRescueOrGameOver, tryTriggerEvent, awardDaySP, advanceToNextDay, saveAll])

  return { handleAccept, handleReject, handleQuery, endDay, handleReturn, handleDisasterContinue, continueAfterModifier, handleEventChoice, startGame, loadSave, handleRescue, handleRescueGiveUp }
}
