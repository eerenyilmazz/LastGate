import React, { useState, useCallback, useEffect, useMemo } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  Platform, useWindowDimensions,
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

const TY = themeData.typography as any
const SP = themeData.spacing
const R  = themeData.radius
const UI       = themeData.ui
const C        = themeData.colors
const L        = uiData.labels
const STATS    = UI.stat_keys as StatType[]
const STAT_MAX = config.stat_max as Record<StatType, number>

const SWIPE_PREVIEW_THRESHOLD = themeData.animation.swipe_threshold

// ─── Horizontal stat bar ────────────────────────────────────────────────────
const StatBarItem = React.memo<{
  icon:        string
  val:         number
  pct:         number
  isCrit:      boolean
  color:       string
  acceptDelta: number
  rejectDelta: number
  max:         number
  dragX:       SharedValue<number>
}>(({ icon, val, pct, isCrit, color, acceptDelta, rejectDelta, max, dragX }) => {

  const pulse  = useSharedValue(1)
  const trackW = useSharedValue(0)

  const [displayVal, setDisplayVal] = useState(val)
  useEffect(() => { setDisplayVal(val) }, [val])

  useAnimatedReaction(
    () => {
      const dx = dragX.value
      if (Math.abs(dx) < 4) return val
      const delta    = dx > 0 ? acceptDelta : rejectDelta
      const progress = Math.min(1, Math.abs(dx) / SWIPE_PREVIEW_THRESHOLD)
      return Math.round(Math.max(0, Math.min(max, val + delta * progress)))
    },
    (cur, prev) => { if (cur !== prev) runOnJS(setDisplayVal)(cur) },
    [val, acceptDelta, rejectDelta, max],
  )

  useEffect(() => {
    if (isCrit) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(0.15, { duration: 400 }),
          withTiming(1,    { duration: 400 }),
        ),
        -1, false,
      )
    } else {
      cancelAnimation(pulse)
      pulse.value = withTiming(1, { duration: 180 })
    }
  }, [isCrit])

  const animStyle = useAnimatedStyle(() => ({ opacity: pulse.value }))

  const fillStyle = useAnimatedStyle(() => {
    'worklet'
    const w  = trackW.value
    const dx = dragX.value
    if (w === 0 || Math.abs(dx) < 4) return { width: w * pct, backgroundColor: color }
    const delta        = dx > 0 ? acceptDelta : rejectDelta
    const progress     = Math.min(1, Math.abs(dx) / SWIPE_PREVIEW_THRESHOLD)
    const projectedPct = Math.max(0, Math.min(1, (val + delta) / max))
    return { width: w * (pct + (projectedPct - pct) * progress), backgroundColor: color }
  })

  return (
    <View style={barS.col}>
      <Animated.Text style={[barS.icon, isCrit && animStyle]}>{icon}</Animated.Text>
      <View style={barS.track}
        onLayout={e => { trackW.value = e.nativeEvent.layout.width }}>
        <Animated.View style={[barS.fill, fillStyle, isCrit && animStyle]} />
      </View>
      <Animated.Text style={[barS.val, { color: isCrit ? C.stat_critical : C.text_muted }, isCrit && animStyle]}>
        {displayVal > 99 ? '99+' : displayVal}
      </Animated.Text>
    </View>
  )
})

const barS = StyleSheet.create({
  col:   { flex: 1, alignItems: 'center', gap: 3 },
  icon:  { fontSize: TY.size_sm },
  track: { width: '100%', height: 4, borderRadius: 2, overflow: 'hidden', backgroundColor: C.card_dark },
  fill:  { height: '100%', borderRadius: 2 },
  val:   { fontSize: TY.size_2xs, fontWeight: TY.weight_heavy },
})

const CARD_ASPECT = 3 / 4

interface Props {
  onMainMenu?: () => void
  playSFX: (key: string) => void
}

export const GameScreen: React.FC<Props> = ({ onMainMenu, playSFX }) => {
  const { width: sw, height: sh } = useWindowDimensions()
  const theme    = useTheme()
  const game     = useGameStore()
  const stats    = useStatStore()
  const progress = useProgressStore()
  const { handleAccept, handleReject, handleQuery, handleEventChoice, endDay } = useGameLoop()

  const dragX = useSharedValue(0)

  const npc   = game.activeNPC
  const event = game.activeEvent

  const npcAccept = useMemo(() => (npc?.accept as StatDelta | undefined) ?? {}, [npc?.npc_id])
  const npcReject = useMemo(() => (npc?.reject as StatDelta | undefined) ?? {}, [npc?.npc_id])

  const [detailsVisible,   setDetailsVisible]   = useState(false)
  const [queryResult,      setQueryResult]      = useState<string | null>(null)
  const [queryWarnPending, setQueryWarnPending] = useState(false)
  const [innerH,           setInnerH]           = useState(sh * 0.88)
  const [tutorialDone,     setTutorialDone]     = useState(false)

  const canQuery  = game.queryChargesLeft > 0
  const isCompact = sh < 700

  // card height: leave room for stat strip (~56) + info row (~36) + toast (~44) + btn rows (~110)
  const usedH        = 56 + 36 + 44 + (isCompact ? 100 : 118)
  const naturalCardH = Math.round(sw * 0.84 / CARD_ASPECT)
  const maxCardH     = Math.max(160, innerH - usedH)
  const cardSlotH    = Math.min(naturalCardH, maxCardH)

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

  const onSafeLayout = useCallback((e: any) => {
    const h = e.nativeEvent.layout.height
    if (h > 0) setInnerH(h)
  }, [])

  const doReject = useCallback(() => {
    if (!npc) return
    playSFX('sfx_door_close')
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    handleReject(npc)
    setQueryResult(null)
    setQueryWarnPending(false)
  }, [npc, playSFX])

  const doAccept = useCallback(() => {
    if (!npc) return
    playSFX('sfx_door_open')
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    handleAccept(npc)
    setQueryResult(null)
    setQueryWarnPending(false)
  }, [npc, playSFX])

  const isDecision = !!(npc && game.phase === 'npc_decision')

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.colors.background }]}
      onLayout={onSafeLayout}
    >
      <AppBar onMainMenu={onMainMenu} />

      {/* ── stat strip ─────────────────────────────────────── */}
      <View style={styles.statStrip}>
        {STATS.map(s => {
          const val    = Math.round(stats.stats[s])
          const pct    = Math.min(1, Math.max(0, val / STAT_MAX[s]))
          const isCrit = stats.isCritical(s)
          const color  = isCrit ? C.stat_critical : (UI.stat_colors as any)[s]
          return (
            <StatBarItem
              key={s}
              icon={(UI.stat_icons as any)[s]}
              val={val} pct={pct} isCrit={isCrit} color={color}
              acceptDelta={npcAccept[s] ?? 0}
              rejectDelta={npcReject[s] ?? 0}
              max={STAT_MAX[s]}
              dragX={dragX}
            />
          )
        })}
      </View>

      {/* ── day + SP info ──────────────────────────────────── */}
      <View style={styles.infoRow}>
        <Text style={styles.dayText}>
          <Text style={styles.dayNum}>{game.day}</Text>
          <Text style={styles.dayLabel}>{L.day_num_suffix}  ·  </Text>
          <Text style={styles.dayLabel}>{config.win_condition_day - game.day}{L.day_status_remaining}</Text>
        </Text>
        <View style={styles.spPill}>
          <Text style={styles.spStar}>★</Text>
          <Text style={styles.spNum}>{progress.sp} SP</Text>
        </View>
      </View>

      {/* ── card ───────────────────────────────────────────── */}
      <View style={[styles.cardSlot, { height: cardSlotH }]}>
        {npc && (
          <SwipeHandler
            key={npc.npc_id}
            dragX={dragX}
            onSwipeRight={doAccept}
            onSwipeLeft={doReject}
            onSwipeUp={onQuery}
            disabled={!isDecision}
          >
            <NPCCard npc={npc} availableHeight={cardSlotH} />
          </SwipeHandler>
        )}
      </View>

      {/* ── toast ──────────────────────────────────────────── */}
      <View style={styles.toastArea}>
        {isDecision && queryWarnPending ? (
          <View style={[styles.toast, { borderColor: C.stat_food }]}>
            <Text style={[styles.toastText, { color: C.stat_food }]}>
              {L.query_food_warn_prefix}{config.query_food_cost}{L.query_food_warn_suffix}
            </Text>
          </View>
        ) : isDecision && queryResult ? (
          <View style={[styles.toast, { borderColor: C.query }]}>
            <Text style={[styles.toastText, { color: C.query }]}>{queryResult}</Text>
          </View>
        ) : null}
      </View>

      {/* ── action bar ─────────────────────────────────────── */}
      <View style={[styles.actions, {
        paddingBottom: Platform.OS === 'android' ? 14 : 8,
        opacity: isDecision ? 1 : 0,
      }]}>
        {/* top row: query + detail */}
        <View style={styles.utilRow}>
          <TouchableOpacity
            onPress={onQuery}
            disabled={!canQuery || !isDecision}
            style={[styles.utilBtn, !canQuery && styles.btnOff, queryWarnPending && styles.queryWarn]}
            activeOpacity={0.8}
          >
            <Text style={[styles.utilBig, {
              color: queryWarnPending ? C.stat_food : canQuery ? C.query : C.text_muted
            }]}>
              {queryWarnPending ? '!' : canQuery ? game.queryChargesLeft : '✕'}
            </Text>
            <Text style={[styles.utilSm, {
              color: queryWarnPending ? C.stat_food : canQuery ? C.query : C.text_muted
            }]}>
              {queryWarnPending ? L.btn_query_confirm : L.btn_query}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setDetailsVisible(true)}
            disabled={!isDecision}
            style={styles.utilBtn}
            activeOpacity={0.8}
          >
            <Text style={[styles.utilBig, { color: C.text_muted, fontStyle: 'italic' }]}>i</Text>
            <Text style={[styles.utilSm, { color: C.text_muted }]}>{L.btn_detail}</Text>
          </TouchableOpacity>
        </View>

        {/* bottom row: reject + accept */}
        <View style={styles.mainRow}>
          <TouchableOpacity
            onPress={doReject}
            disabled={!isDecision}
            style={[styles.mainBtn, styles.rejectBtn, isCompact && styles.mainBtnCompact]}
            activeOpacity={0.75}
          >
            <Text style={styles.rejectMark}>✕</Text>
            <Text style={styles.rejectLabel}>{L.btn_reject}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={doAccept}
            disabled={!isDecision}
            style={[styles.mainBtn, styles.acceptBtn, isCompact && styles.mainBtnCompact]}
            activeOpacity={0.75}
          >
            <Text style={styles.acceptMark}>✓</Text>
            <Text style={styles.acceptLabel}>{L.btn_accept}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── overlays ───────────────────────────────────────── */}
      {game.phase === 'intro' && (
        <IntroScreen onStart={() => game.setPhase('npc_decision')} />
      )}
      {game.phase === 'npc_arrival' && game.notifications.length > 0 && (
        <NotificationOverlay onContinue={() => {
          game.clearNotifications()
          game.setPhase('npc_decision')
        }} />
      )}
      {game.day === 1 && !tutorialDone && game.phase === 'npc_decision' && (
        <TutorialOverlay onClose={() => setTutorialDone(true)} />
      )}
      {event && game.phase === 'event' && (
        <EventModal
          event={event}
          acceptedRoles={game.acceptedNPCRoles as NPCRole[]}
          onChoice={handleEventChoice}
        />
      )}
      {game.phase === 'day_summary' && (
        <DaySummary onContinue={endDay} onBuilding={() => game.setPhase('building')} />
      )}
      {npc && (
        <CardDetails npc={npc} visible={detailsVisible} onClose={() => setDetailsVisible(false)} />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },

  // stat strip — full width, single row, 4 equal cols
  statStrip: {
    flexDirection: 'row',
    paddingHorizontal: SP.md,
    paddingTop: SP.sm,
    paddingBottom: SP.xs,
    gap: SP.sm,
    borderBottomWidth: 1,
    borderBottomColor: C.divider,
  },

  // day + SP
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SP.md,
    paddingVertical: SP.xs,
  },
  dayText: {},
  dayNum:   { color: C.text_primary, fontSize: TY.size_body, fontWeight: TY.weight_heavy },
  dayLabel: { color: C.text_muted,   fontSize: TY.size_xs },
  spPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: C.card_bg,
    borderRadius: R.pill,
    paddingHorizontal: SP.sm,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: C.button_border,
  },
  spStar: { color: C.query,        fontSize: TY.size_xs },
  spNum:  { color: C.text_primary, fontSize: TY.size_xs, fontWeight: TY.weight_heavy },

  // card
  cardSlot: { justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },

  // toast
  toastArea: { height: 44, paddingHorizontal: SP.md, justifyContent: 'center' },
  toast: {
    paddingHorizontal: SP.md, paddingVertical: 8,
    borderRadius: R.pill, borderWidth: 1,
    backgroundColor: C.surface,
    alignSelf: 'center',
  },
  toastText: { fontSize: TY.size_sm, textAlign: 'center' },

  // action area
  actions: {
    paddingHorizontal: SP.md,
    paddingTop: SP.xs,
    gap: SP.xs,
  },

  // top utility row
  utilRow: {
    flexDirection: 'row',
    gap: SP.sm,
  },
  utilBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    borderRadius: R.md,
    borderWidth: 1,
    backgroundColor: C.card_bg,
    borderColor: C.divider,
  },
  queryWarn:  { borderColor: C.stat_food, backgroundColor: C.card_dark },
  btnOff:     { opacity: 0.3 },
  utilBig:    { fontSize: TY.size_md, fontWeight: TY.weight_black },
  utilSm:     { fontSize: TY.size_caption, fontWeight: TY.weight_bold, letterSpacing: 0.4 },

  // bottom main row
  mainRow: {
    flexDirection: 'row',
    gap: SP.sm,
  },
  mainBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: R.xl,
    gap: 2,
    borderWidth: 2,
  },
  mainBtnCompact: { paddingVertical: 10 },

  rejectBtn:   { backgroundColor: C.danger_dark, borderColor: C.danger },
  acceptBtn:   { backgroundColor: C.accept + '1a', borderColor: C.accept },

  rejectMark:  { fontSize: TY.size_h4, color: C.danger,      fontWeight: TY.weight_black },
  rejectLabel: { fontSize: TY.size_xs,  color: C.danger,      fontWeight: TY.weight_heavy, letterSpacing: 0.6 },
  acceptMark:  { fontSize: TY.size_h4, color: C.accept_glow, fontWeight: TY.weight_black },
  acceptLabel: { fontSize: TY.size_xs,  color: C.accept_glow, fontWeight: TY.weight_heavy, letterSpacing: 0.6 },
})
