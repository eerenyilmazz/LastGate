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
import { StatDelta, StatState } from '../types/stat.types'
import config from '../data/config.json'
import ui from '../data/ui.json'

// NPCGenerator instance — singleton per session
const generator = new NPCGenerator()

// ── Bina bazlı yardımcılar ─────────────────────────────────────────────────

const BUILDINGS = config.buildings as Array<{
  id: string
  extra_query_charge?: number
  infection_reduction?: number
}>

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

// ──────────────────────────────────────────────────────────────────────────

export const useGameLoop = () => {
  const game     = useGameStore()
  const stats    = useStatStore()
  const progress = useProgressStore()
  const settings = useSettingsStore()

  // Günde kaç NPC gelecek
  const npcsLeft = useRef(1)
  const rollDay  = () => {
    npcsLeft.current = Math.floor(
      Math.random() * (config.npcs_per_day_max - config.npcs_per_day_min + 1)
    ) + config.npcs_per_day_min
  }

  // --- GÜN SONU İŞLEMİ ---

  const endDay = useCallback(() => {
    // 0. Günün başlangıç istatistiklerini sakla (perfect_day için)
    const dayStartStats: StatState = { ...stats.stats }

    // 1. Pasif bina bonusları
    stats.applyPassive(progress.buildings)

    // 2. Rol sinerji bonusları
    const synergyDelta = StatEngine.computeRoleSynergy(game.acceptedRoleCounts)
    stats.apply(synergyDelta)

    // 3. Yiyecek tüketimi
    stats.applyFoodConsumption()

    // 4. Açlık hasarı
    stats.applyStarvation()

    // 5. Gizli trait tick
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

    // 6. Game over kontrolü
    const reason = stats.getGameOverReason()
    if (reason) {
      progress.updateBestRun(game.day, false)
      game.setGameOver(reason as any)
      progress.addSP(config.sp_rewards.game_over)
      saveAll()
      return
    }

    // 7. Zafer kontrolü
    if (game.day >= config.win_condition_day) {
      progress.updateBestRun(game.day, true)
      game.setGameOver('victory' as any)
      progress.addSP(config.sp_rewards.game_over)
      saveAll()
      return
    }

    // 8. Event kontrolü
    if (EventManager.shouldTrigger(game.day)) {
      const event = EventManager.pickEvent(stats.stats, game.usedEventIDs)
      if (event) {
        game.setActiveEvent(event)
        game.setPhase('event')
        return
      }
    }

    // 9. SP kazanımı
    progress.addSP(config.sp_rewards.day_survived)

    // 10. Perfect day kontrolü (gün başı istatistikleriyle karşılaştır)
    const cur    = stats.stats
    const noDrop = Object.keys(cur).every(k => cur[k as keyof typeof cur] >= dayStartStats[k as keyof typeof dayStartStats])
    if (noDrop) progress.addSP(config.sp_rewards.perfect_day)

    // 11. Yeni güne geç — npc_arrival fazında bekle (NotificationOverlay için)
    rollDay()
    game.advanceDay(computeQueryCharges(progress.buildings))
    const nextNPC = generator.getNext()
    game.setActiveNPC(nextNPC)

    saveAll()
  }, [game, stats, progress])

  // --- NPC KARARI ---

  const handleAccept = useCallback((npc: NPC) => {
    const effectiveStats = npc.hidden_trait === 'liar'
      ? TraitHandler.getLiarAcceptStats(npc.accept)
      : npc.accept

    stats.apply(effectiveStats as StatDelta)
    game.addAcceptedRole(npc.role)
    game.incrementRunStat('accepted')

    // HiddenSystem.enqueue artık none/liar dışında hepsini alır (protector dahil)
    if (npc.hidden_trait !== 'none' && npc.hidden_trait !== 'liar') {
      game.enqueueTrait({ npc_id: npc.npc_id, trait: npc.hidden_trait, accepted_day: game.day })
    }

    progress.addSP(config.sp_rewards.correct_npc_decision)

    const overReason = stats.getGameOverReason()
    if (overReason) {
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
  }, [game, stats, progress, endDay])

  const handleReject = useCallback((npc: NPC) => {
    stats.apply(npc.reject as StatDelta)
    game.incrementRunStat('rejected')

    const overReason = stats.getGameOverReason()
    if (overReason) {
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
  }, [game, stats, progress, endDay])

  const handleQuery = useCallback((npc: NPC): string => {
    const result = game.consumeQueryCharge()
    if (!result.success) return ui.query_messages.no_charges
    game.incrementRunStat('queries')

    // 2. ve 3. sorgular yiyecek götürür
    if (!result.isFree) {
      stats.apply({ food: -config.query_food_cost })
    }

    if (result.queryIndex === 0) {
      return ui.role_surface_scan[npc.role] ?? ui.query_messages.default_scan
    }

    if (result.queryIndex === 1) {
      return `${ui.query_messages.depth_analysis_prefix}${npc.clue_text}`
    }

    return ui.trait_final[npc.hidden_trait] ?? npc.clue_text
  }, [game, stats])

  // --- EVENT KARARI ---

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

    const overReason = stats.getGameOverReason()
    if (overReason) {
      game.setGameOver(overReason as any)
      progress.addSP(config.sp_rewards.game_over)
      saveAll()
      return
    }

    progress.addSP(config.sp_rewards.day_survived)
    rollDay()
    game.advanceDay(computeQueryCharges(progress.buildings))
    const nextNPC = generator.getNext()
    game.setActiveNPC(nextNPC)
    // npc_arrival fazında kal — GameScreen'deki useEffect otomatik geçiş yapar

    saveAll()
  }, [game, stats, progress])

  // --- YARDIMCILAR ---

  const DIFF_MULT: Record<string, number> = { easy: 0.3, normal: 0.0, hard: -0.25 }

  const startGame = useCallback(() => {
    generator.reset()
    game.reset()
    stats.reset()
    progress.reset()

    // Zorluk başlangıç stat ayarı
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
