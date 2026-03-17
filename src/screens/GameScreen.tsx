import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  Platform, useWindowDimensions, type ViewStyle,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as Haptics from 'expo-haptics'
import Animated, {
  useSharedValue, useAnimatedStyle, useAnimatedReaction, runOnJS,
  withRepeat, withSequence, withTiming, cancelAnimation,
  type SharedValue,
} from 'react-native-reanimated'
import { useTheme } from '../hooks/useTheme'
import { useGameStore } from '../store/useGameStore'
import { useStatStore } from '../store/useStatStore'
import { useProgressStore } from '../store/useProgressStore'
import { useGameLoop } from '../hooks/useGameLoop'
import { AppBar } from '../components/AppBar'
import { NPCCard } from '../components/Card/NPCCard'
import { SwipeHandler } from '../components/Card/SwipeHandler'
import { CardDetails } from '../components/Card/CardDetails'
import { EventModal } from '../components/Overlays/EventModal'
import { DaySummary } from '../components/Overlays/DaySummary'
import { IntroScreen } from '../components/Overlays/IntroScreen'
import { NotificationOverlay } from '../components/Overlays/NotificationOverlay'
import { TutorialOverlay } from '../components/Overlays/TutorialOverlay'
import { StatType, StatDelta } from '../types/stat.types'
import { NPCRole } from '../types/npc.types'
import config from '../data/config.json'
import themeData from '../data/theme.json'
import uiData from '../data/ui.json'

const TY   = themeData.typography as any
const SP   = themeData.spacing
const R    = themeData.radius
const UI   = themeData.ui
const C    = themeData.colors
const L    = uiData.labels
const STATS    = UI.stat_keys as StatType[]
const STAT_MAX = config.stat_max as Record<StatType, number>
const MONO = Platform.select(themeData.ui.font_mono) as string

const SWIPE_THRESHOLD = themeData.animation.swipe_threshold
const ROLE_COLORS = themeData.ui.role_colors as Record<string, string>
const ROLE_TR     = themeData.ui.role_names_tr as Record<string, string>

// ─── Stat Icon (Reigns-style: icon + value, no bar) ─────────────────────────
const StatIcon = React.memo<{
  icon:        string
  val:         number
  isCrit:      boolean
  color:       string
  acceptDelta: number
  rejectDelta: number
  max:         number
  dragX:       SharedValue<number>
}>(({ icon, val, isCrit, color, acceptDelta, rejectDelta, max, dragX }) => {

  const pulse      = useSharedValue(1)
  const [displayVal, setDisplayVal] = useState(val)

  useEffect(() => { setDisplayVal(val) }, [val])

  useAnimatedReaction(
    () => {
      const dx = dragX.value
      if (Math.abs(dx) < 4) return val
      const delta    = dx > 0 ? acceptDelta : rejectDelta
      const progress = Math.min(1, Math.abs(dx) / SWIPE_THRESHOLD)
      return Math.round(Math.max(0, Math.min(max, val + delta * progress)))
    },
    (cur, prev) => { if (cur !== prev) runOnJS(setDisplayVal)(cur) },
    [val, acceptDelta, rejectDelta, max],
  )

  useEffect(() => {
    if (isCrit) {
      pulse.value = withRepeat(
        withSequence(withTiming(0.15, { duration: 320 }), withTiming(1, { duration: 320 })),
        -1, false,
      )
    } else {
      cancelAnimation(pulse)
      pulse.value = withTiming(1, { duration: 180 })
    }
  }, [isCrit])

  const diff        = displayVal - val
  const showDiff    = Math.abs(diff) >= 1
  const diffPos     = diff > 0
  const activeColor = isCrit      ? C.stat_critical
    : showDiff ? (diffPos ? C.accept_glow : C.reject_glow)
    : color

  const blinkStyle = useAnimatedStyle(() => ({ opacity: pulse.value }))

  return (
    <Animated.View style={[sIcon.wrap, isCrit && blinkStyle]}>
      <Text style={sIcon.emoji}>{icon}</Text>
      <Text style={[sIcon.val, { color: activeColor, fontFamily: MONO }]}>
        {displayVal > 999 ? '999' : displayVal}
      </Text>
      {/* always rendered — opacity toggle prevents layout jump */}
      <Text style={[sIcon.diff, {
        color: diffPos ? C.accept_glow : C.reject_glow,
        fontFamily: MONO,
        opacity: showDiff ? 1 : 0,
      }]}>
        {diff > 0 ? `+${diff}` : diff < 0 ? `${diff}` : '+0'}
      </Text>
    </Animated.View>
  )
})

const sIcon = StyleSheet.create({
  wrap:  { alignItems: 'center', flex: 1, paddingVertical: 6 },
  emoji: { fontSize: 22 },
  val:   { fontSize: TY.size_sm, fontWeight: TY.weight_black, marginTop: 3, letterSpacing: 0.3 },
  diff:  { fontSize: 9,          fontWeight: TY.weight_heavy, marginTop: 2, letterSpacing: 0.3 },
})

// ─── Card glow ring — must be inside SwipeHandler so it moves with the card ──
const CardGlow = React.memo<{ dragX: SharedValue<number> }>(({ dragX }) => {
  const acceptStyle = useAnimatedStyle(() => {
    'worklet'
    const dx = dragX.value
    return { opacity: dx > 4 ? Math.min(0.92, dx / SWIPE_THRESHOLD) : 0 }
  })
  const rejectStyle = useAnimatedStyle(() => {
    'worklet'
    const dx = dragX.value
    return { opacity: dx < -4 ? Math.min(0.92, -dx / SWIPE_THRESHOLD) : 0 }
  })
  return (
    <>
      <Animated.View pointerEvents="none" style={[glowStyles.base, {
        borderColor: C.accept,
        shadowColor: C.accept_glow,
        backgroundColor: C.accept + '08',
      }, acceptStyle]} />
      <Animated.View pointerEvents="none" style={[glowStyles.base, {
        borderColor: C.danger,
        shadowColor: C.danger,
        backgroundColor: C.danger + '08',
      }, rejectStyle]} />
    </>
  )
})

const glowStyles = StyleSheet.create({
  base: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 19,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 22,
  },
})

// ─────────────────────────────────────────────────────────────────────────────

const CARD_ASPECT = 3 / 4

interface Props {
  onMainMenu?: () => void
  playSFX: (key: string) => void
}

export const GameScreen: React.FC<Props> = ({ onMainMenu, playSFX }) => {
  const { width: sw } = useWindowDimensions()
  const theme    = useTheme()
  const game     = useGameStore()
  const stats    = useStatStore()
  const progress = useProgressStore()
  const { handleAccept, handleReject, handleQuery, handleEventChoice, endDay } = useGameLoop()

  const dragX = useSharedValue(0)
  const dragY = useSharedValue(0)

  const npc   = game.activeNPC
  const event = game.activeEvent

  const npcAccept = useMemo(() => (npc?.accept as StatDelta | undefined) ?? {}, [npc?.npc_id])
  const npcReject = useMemo(() => (npc?.reject as StatDelta | undefined) ?? {}, [npc?.npc_id])

  const [detailsVisible,   setDetailsVisible]   = useState(false)
  const [queryResult,      setQueryResult]      = useState<string | null>(null)
  const [queryWarnPending, setQueryWarnPending] = useState(false)
  const [cardZoneH,        setCardZoneH]        = useState(360)
  const [tutorialDone,     setTutorialDone]     = useState(false)
  const canQuery = game.queryChargesLeft > 0

  // card fills the zone it actually has — onLayout drives this
  const naturalCardH = Math.round(sw * 0.93 / CARD_ASPECT)
  const cardSlotH    = Math.min(naturalCardH, Math.max(200, cardZoneH))

  const dayPct = Math.round(((game.day - 1) / Math.max(1, config.win_condition_day - 1)) * 100)

  useEffect(() => {
    if (game.phase !== 'npc_arrival') return
    if (game.notifications.length > 0) return
    game.setPhase('npc_decision')
  }, [game.phase, game.notifications.length])

  useEffect(() => {
    if (!queryResult) return
    const t = setTimeout(() => setQueryResult(null), config.query_result_timeout_ms)
    return () => clearTimeout(t)
  }, [queryResult])

  useEffect(() => {
    setQueryResult(null)
    setQueryWarnPending(false)
    dragX.value = 0
    dragY.value = 0
  }, [npc?.npc_id])

  useEffect(() => {
    if (!game.isGameOver) return
    game.gameOverReason === 'victory'
      ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      : Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
  }, [game.isGameOver])

  const onQuery = () => {
    if (!npc) return
    if (queryWarnPending) {
      setQueryWarnPending(false)
      playSFX('sfx_query')
      setQueryResult(handleQuery(npc))
      return
    }
    if (game.queryChargesLeft === game.queryChargesTotal) {
      playSFX('sfx_query')
      setQueryResult(handleQuery(npc))
    } else {
      setQueryWarnPending(true)
    }
  }

  const onCardZoneLayout = useCallback((e: any) => {
    const h = e.nativeEvent.layout.height
    if (h > 0) setCardZoneH(h)
  }, [])

  const doReject = useCallback(() => {
    if (!npc) return
    playSFX('sfx_door_close')
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
    handleReject(npc)
    setQueryResult(null); setQueryWarnPending(false)
  }, [npc, playSFX])

  const doAccept = useCallback(() => {
    if (!npc) return
    playSFX('sfx_door_open')
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    handleAccept(npc)
    setQueryResult(null); setQueryWarnPending(false)
  }, [npc, playSFX])

  const isDecision = !!(npc && game.phase === 'npc_decision')

  const queryToast = isDecision && queryWarnPending
    ? { text: `⚠  ${L.query_food_warn_prefix}${config.query_food_cost}${L.query_food_warn_suffix}`, color: C.query }
    : isDecision && queryResult
    ? { text: `▶  ${queryResult}`, color: C.accept_glow }
    : null

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.background }]}>
      <AppBar onMainMenu={onMainMenu} />

      {/* ── STAT ICONS ROW ─────────────────────────────────── */}
      <View style={styles.statBar}>
        {STATS.map(s => (
          <StatIcon key={s}
            icon={(UI.stat_icons as any)[s]}
            val={Math.round(stats.stats[s])}
            isCrit={stats.isCritical(s)}
            color={(UI.stat_colors as any)[s]}
            acceptDelta={npcAccept[s] ?? 0}
            rejectDelta={npcReject[s] ?? 0}
            max={STAT_MAX[s]}
            dragX={dragX}
          />
        ))}
      </View>

      {/* ── CARD ZONE — flex:1 fills all remaining space ──── */}
      <View style={styles.cardZone} onLayout={onCardZoneLayout}>
        {npc && (
          <SwipeHandler
            key={npc.npc_id}
            dragX={dragX}
            dragY={dragY}
            onSwipeRight={doAccept}
            onSwipeLeft={doReject}
            onTap={onQuery}
            disabled={!isDecision}
          >
            <View>
              <CardGlow dragX={dragX} />
              <NPCCard npc={npc} availableHeight={cardSlotH} hideDialogue />
            </View>
          </SwipeHandler>
        )}
        {queryToast && (
          <View style={[styles.queryToast, { borderColor: queryToast.color + '66', backgroundColor: queryToast.color + '18' }]}>
            <Text style={[styles.queryToastText, { color: queryToast.color, fontFamily: MONO }]} numberOfLines={2}>
              {queryToast.text}
            </Text>
          </View>
        )}
      </View>

      {/* ── DIALOGUE STRIP — resets per NPC via key ───────── */}
      <View style={styles.dialogueStrip} key={npc?.npc_id ?? 'empty'}>
        {npc && (() => {
          const roleColor = ROLE_COLORS[npc.role] ?? C.text_muted
          return (
            <View style={[styles.dialogueInner, { borderLeftColor: roleColor + 'bb' }]}>
              <Text style={[styles.dialogueStr, { color: C.text_secondary }]} numberOfLines={3}>
                <Text style={{ color: roleColor, fontWeight: TY.weight_black }}>"</Text>
                {npc.dialogue}
                <Text style={{ color: roleColor, fontWeight: TY.weight_black }}>"</Text>
              </Text>
            </View>
          )
        })()}
      </View>

      {/* ── INFO BAR ───────────────────────────────────────── */}
      <View style={styles.infoBar}>
        <View style={styles.dayBlock}>
          <Text style={[styles.dayLabel, { fontFamily: MONO }]}>GÜN</Text>
          <Text style={[styles.dayVal, { fontFamily: MONO }]}>
            {String(game.day).padStart(2, '0')}
            <Text style={[styles.dayMax, { fontFamily: MONO }]}>/{config.win_condition_day}</Text>
          </Text>
        </View>
        <View style={styles.progressWrap}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${dayPct}%` as any }]} />
          </View>
          <Text style={[styles.progressPct, { fontFamily: MONO }]}>{dayPct}%</Text>
        </View>
      </View>

      {/* ── DETAIL ROW ─────────────────────────────────────── */}
      <View style={[styles.detailRow, {
        paddingBottom: Platform.OS === 'android' ? 6 : 4,
        opacity: isDecision ? 1 : 0.3,
      }]}>
        <TouchableOpacity
          onPress={() => setDetailsVisible(true)}
          disabled={!isDecision}
          style={styles.detailBtn}
          activeOpacity={0.7}
        >
          <Text style={[styles.detailBtnText, { fontFamily: MONO }]}>
            ▸ KİŞİ DOSYASI
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── OVERLAYS ───────────────────────────────────────── */}
      {game.phase === 'intro' && <IntroScreen onStart={() => game.setPhase('npc_decision')} />}
      {game.phase === 'npc_arrival' && game.notifications.length > 0 && (
        <NotificationOverlay onContinue={() => { game.clearNotifications(); game.setPhase('npc_decision') }} />
      )}
      {game.day === 1 && !tutorialDone && game.phase === 'npc_decision' && (
        <TutorialOverlay onClose={() => setTutorialDone(true)} />
      )}
      {event && game.phase === 'event' && (
        <EventModal event={event} acceptedRoles={game.acceptedNPCRoles as NPCRole[]} onChoice={handleEventChoice} />
      )}
      {game.phase === 'day_summary' && (
        <DaySummary onContinue={endDay} onBuilding={() => game.setPhase('building')} />
      )}
      {npc && <CardDetails npc={npc} visible={detailsVisible} onClose={() => setDetailsVisible(false)} />}
    </SafeAreaView>
  )
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1 },

  // Stat icons row
  statBar: {
    flexDirection: 'row',
    paddingHorizontal: SP.xs,
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.accept + '1a',
  },

  // Card — takes all remaining vertical space
  cardZone: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  queryToast: {
    position: 'absolute',
    bottom: 16,
    left: 24,
    right: 24,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: R.md,
    borderWidth: 1,
  },
  queryToastText: {
    fontSize: TY.size_sm,
    lineHeight: 18,
    letterSpacing: 0.3,
  },

  // Dialogue strip
  dialogueStrip: {
    height: 72,
    paddingHorizontal: SP.lg,
    justifyContent: 'center',
  },
  dialogueInner: {
    borderLeftWidth: 2,
    paddingLeft: 12,
  },
  dialogueStr: {
    fontSize: TY.size_body,
    lineHeight: 21,
    fontStyle: 'italic',
    letterSpacing: 0.1,
  },

  // Info bar
  infoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SP.sm,
    paddingVertical: 9,
    gap: SP.sm,
    backgroundColor: C.bg_deeper,
    borderTopWidth: 1,
    borderTopColor: C.divider,
  },
  dayBlock: { minWidth: 50 },
  dayLabel: {
    color: C.text_muted,
    fontSize: 7,
    fontWeight: TY.weight_heavy,
    letterSpacing: 2,
    marginBottom: 1,
  },
  dayVal: {
    color: C.accept_glow,
    fontSize: TY.size_h6,
    fontWeight: TY.weight_black,
  },
  dayMax: {
    fontSize: TY.size_xs,
    color: C.text_muted,
    fontWeight: TY.weight_bold,
  },
  progressWrap: { flex: 1, gap: 3 },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: C.card_dark,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: C.accept + '66',
    borderRadius: 2,
  },
  progressPct: {
    fontSize: 8,
    color: C.text_muted,
    fontWeight: TY.weight_heavy,
    letterSpacing: 1,
    textAlign: 'right',
  },

  // Detail row
  detailRow: {
    alignItems: 'center',
    paddingHorizontal: SP.md,
    paddingTop: 6,
  },
  detailBtn: {
    paddingHorizontal: SP.xl,
    paddingVertical: 10,
    borderRadius: R.xs,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: C.text_muted + '55',
    backgroundColor: C.card_dark,
  },
  detailBtnText: {
    fontSize: TY.size_sm,
    fontWeight: TY.weight_bold,
    color: C.text_muted,
    letterSpacing: 2,
  },
})
