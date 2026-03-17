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

// ─── Horizontal stat bar (Reigns-style) ────────────────────────────────────
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

    if (w === 0 || Math.abs(dx) < 4) {
      return { width: w * pct, backgroundColor: color }
    }

    const delta        = dx > 0 ? acceptDelta : rejectDelta
    const progress     = Math.min(1, Math.abs(dx) / SWIPE_PREVIEW_THRESHOLD)
    const projectedPct = Math.max(0, Math.min(1, (val + delta) / max))
    const displayW     = w * (pct + (projectedPct - pct) * progress)

    return { width: displayW, backgroundColor: color }
  })

  return (
    <View style={barStyles.row}>
      <Animated.Text style={[barStyles.icon, isCrit && animStyle]}>{icon}</Animated.Text>

      <View
        style={barStyles.track}
        onLayout={e => { trackW.value = e.nativeEvent.layout.width }}
      >
        <Animated.View style={[barStyles.fill, fillStyle, isCrit && animStyle]} />
      </View>

      <Animated.Text style={[barStyles.val, { color: isCrit ? C.stat_critical : C.text_muted }, isCrit && animStyle]}>
        {displayVal > 999 ? '99+' : displayVal}
      </Animated.Text>
    </View>
  )
})

const barStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  icon:  { fontSize: TY.size_sm, width: 18, textAlign: 'center' },
  track: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
    backgroundColor: C.card_dark,
  },
  fill:  { height: '100%', borderRadius: 3 },
  val:   { fontSize: TY.size_2xs, fontWeight: TY.weight_heavy, width: 22, textAlign: 'right' },
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

  const naturalCardH = Math.round(sw * 0.84 / CARD_ASPECT)
  const maxCardH     = Math.round((innerH - 44) * 0.64)
  const cardSlotH    = Math.min(naturalCardH, maxCardH)

  const btnH = isCompact ? 52 : 62

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
    if (game.gameOverReason === 'victory') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    }
  }, [game.isGameOver])

  const onQuery = () => {
    if (!npc) return
    if (queryWarnPending) {
      setQueryWarnPending(false)
      playSFX('sfx_query')
      setQueryResult(handleQuery(npc))
      return
    }
    const isFirstQuery = game.queryChargesLeft === game.queryChargesTotal
    if (isFirstQuery) {
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
    playSFX('sfx_door_close')
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    handleReject(npc!)
    setQueryResult(null)
    setQueryWarnPending(false)
  }, [npc, playSFX])

  const doAccept = useCallback(() => {
    playSFX('sfx_door_open')
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    handleAccept(npc!)
    setQueryResult(null)
    setQueryWarnPending(false)
  }, [npc, playSFX])

  const isDecision = npc && game.phase === 'npc_decision'

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.colors.background }]}
      onLayout={onSafeLayout}
    >
      <AppBar onMainMenu={onMainMenu} />

      {/* ── stat + day strip ──────────────────────────────────── */}
      <View style={styles.strip}>
        <View style={styles.statGrid}>
          {STATS.map((s, i) => {
            const val    = Math.round(stats.stats[s])
            const pct    = Math.min(1, Math.max(0, val / STAT_MAX[s]))
            const isCrit = stats.isCritical(s)
            const color  = isCrit ? C.stat_critical : (UI.stat_colors as any)[s]
            return (
              <StatBarItem
                key={s}
                icon={(UI.stat_icons as any)[s]}
                val={val}
                pct={pct}
                isCrit={isCrit}
                color={color}
                acceptDelta={npcAccept[s] ?? 0}
                rejectDelta={npcReject[s] ?? 0}
                max={STAT_MAX[s]}
                dragX={dragX}
              />
            )
          })}
        </View>

        <View style={styles.dayInfo}>
          <Text style={styles.dayNum}>{game.day}<Text style={styles.dayLabel}>{L.day_num_suffix}</Text></Text>
          <View style={styles.spPill}>
            <Text style={styles.spStar}>★</Text>
            <Text style={styles.spNum}>{progress.sp}</Text>
          </View>
        </View>
      </View>

      {/* ── card area ─────────────────────────────────────────── */}
      <View style={styles.center}>
        <View style={[styles.cardSlot, { height: cardSlotH }]}>
          {npc && (
            <SwipeHandler
              key={npc.npc_id}
              dragX={dragX}
              onSwipeRight={doAccept}
              onSwipeLeft={doReject}
              onSwipeUp={onQuery}
              disabled={game.phase !== 'npc_decision'}
            >
              <NPCCard npc={npc} availableHeight={cardSlotH} />
            </SwipeHandler>
          )}
        </View>
      </View>

      {/* ── query result toast ────────────────────────────────── */}
      <View style={styles.toastArea}>
        {isDecision && queryWarnPending ? (
          <View style={[styles.toast, styles.toastWarn]}>
            <Text style={styles.toastWarnText}>
              {L.query_food_warn_prefix}{config.query_food_cost}{L.query_food_warn_suffix}
            </Text>
          </View>
        ) : isDecision && queryResult ? (
          <View style={[styles.toast, { borderColor: C.query }]}>
            <Text style={[styles.toastText, { color: C.query }]}>{queryResult}</Text>
          </View>
        ) : null}
      </View>

      {/* ── action bar ────────────────────────────────────────── */}
      <View style={[styles.actionBar, {
        paddingBottom: Platform.OS === 'android' ? 12 : 6,
        opacity: isDecision ? 1 : 0,
      }]}>
        {/* Reject */}
        <TouchableOpacity
          onPress={doReject}
          disabled={!isDecision}
          style={[styles.mainBtn, styles.rejectBtn, { height: btnH }]}
          activeOpacity={0.8}
        >
          <Text style={styles.rejectMark}>✕</Text>
          <Text style={styles.rejectLabel}>{L.btn_reject}</Text>
        </TouchableOpacity>

        {/* Utility buttons */}
        <View style={styles.utilCol}>
          <TouchableOpacity
            onPress={onQuery}
            disabled={!canQuery || !isDecision}
            style={[styles.utilBtn, !canQuery && styles.btnDisabled,
              queryWarnPending && styles.queryBtnWarn]}
            activeOpacity={0.8}
          >
            <Text style={[styles.utilIcon, {
              color: queryWarnPending ? C.stat_food : canQuery ? C.query : C.text_muted
            }]}>
              {queryWarnPending ? '!' : game.queryChargesLeft > 0 ? game.queryChargesLeft : '✕'}
            </Text>
            <Text style={[styles.utilLabel, {
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
            <Text style={[styles.utilIcon, { color: C.text_muted, fontStyle: 'italic' }]}>i</Text>
            <Text style={[styles.utilLabel, { color: C.text_muted }]}>{L.btn_detail}</Text>
          </TouchableOpacity>
        </View>

        {/* Accept */}
        <TouchableOpacity
          onPress={doAccept}
          disabled={!isDecision}
          style={[styles.mainBtn, styles.acceptBtn, { height: btnH }]}
          activeOpacity={0.8}
        >
          <Text style={styles.acceptMark}>✓</Text>
          <Text style={styles.acceptLabel}>{L.btn_accept}</Text>
        </TouchableOpacity>
      </View>

      {/* ── overlays ──────────────────────────────────────────── */}
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
  safe:   { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // ── stat + day strip
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SP.md,
    paddingVertical: SP.sm,
    borderBottomWidth: 1,
    borderBottomColor: C.divider,
    gap: SP.md,
  },
  statGrid: {
    flex: 1,
    gap: 4,
  },
  dayInfo: {
    alignItems: 'flex-end',
    gap: 4,
  },
  dayNum: {
    color: C.text_primary,
    fontSize: TY.size_h6,
    fontWeight: TY.weight_heavy,
    letterSpacing: 0.3,
  },
  dayLabel: {
    fontSize: TY.size_xs,
    fontWeight: TY.weight_semi,
    color: C.text_muted,
  },
  spPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: C.card_bg,
    borderRadius: R.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: C.button_border,
  },
  spStar: { color: C.query, fontSize: TY.size_xs },
  spNum:  { color: C.text_primary, fontSize: TY.size_xs, fontWeight: TY.weight_heavy },

  // ── card slot
  cardSlot: { justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },

  // ── toast
  toastArea: { height: 46, paddingHorizontal: SP.md, justifyContent: 'center' },
  toast: {
    paddingHorizontal: SP.md,
    paddingVertical: 8,
    borderRadius: R.pill,
    borderWidth: 1,
    backgroundColor: C.surface,
  },
  toastText:     { fontSize: TY.size_sm, lineHeight: 18 },
  toastWarn:     { borderColor: C.stat_food },
  toastWarnText: { color: C.stat_food, fontSize: TY.size_note, fontWeight: TY.weight_bold },

  // ── action bar
  actionBar: {
    flexDirection: 'row',
    gap: SP.sm,
    paddingHorizontal: SP.md,
    paddingTop: SP.sm,
    alignItems: 'stretch',
  },

  // main big buttons
  mainBtn: {
    flex: 3,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: R.xl,
    gap: 2,
    borderWidth: 2,
  },
  rejectBtn: {
    backgroundColor: C.danger_dark,
    borderColor: C.danger,
  },
  acceptBtn: {
    backgroundColor: C.accept + '22',
    borderColor: C.accept,
  },
  rejectMark:  { fontSize: TY.size_h4, color: C.danger,      fontWeight: TY.weight_black },
  rejectLabel: { fontSize: TY.size_xs,  color: C.danger,      fontWeight: TY.weight_heavy, letterSpacing: 0.5 },
  acceptMark:  { fontSize: TY.size_h4, color: C.accept_glow, fontWeight: TY.weight_black },
  acceptLabel: { fontSize: TY.size_xs,  color: C.accept_glow, fontWeight: TY.weight_heavy, letterSpacing: 0.5 },

  // utility col
  utilCol: {
    flex: 2,
    gap: SP.xs,
  },
  utilBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: R.md,
    borderWidth: 1,
    backgroundColor: C.card_bg,
    borderColor: C.divider,
  },
  queryBtnWarn: { borderColor: C.stat_food, backgroundColor: C.card_dark },
  utilIcon:  { fontSize: TY.size_md, fontWeight: TY.weight_black },
  utilLabel: { fontSize: TY.size_caption, fontWeight: TY.weight_bold, letterSpacing: 0.3 },
  btnDisabled: { opacity: 0.3 },
})
