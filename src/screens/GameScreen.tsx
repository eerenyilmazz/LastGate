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

const UI       = themeData.ui
const C        = themeData.colors
const L        = uiData.labels
const STATS    = UI.stat_keys as StatType[]
const STAT_MAX = config.stat_max as Record<StatType, number>

const SWIPE_PREVIEW_THRESHOLD = themeData.animation.swipe_threshold

const StatBarItem = React.memo<{
  icon:         string
  val:          number
  pct:          number
  isCrit:       boolean
  color:        string
  acceptDelta:  number
  rejectDelta:  number
  max:          number
  dragX:        SharedValue<number>
}>(({ icon, val, pct, isCrit, color, acceptDelta, rejectDelta, max, dragX }) => {

  const pulse  = useSharedValue(1)
  const trackH = useSharedValue(0)

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
          withTiming(0.12, { duration: 380 }),
          withTiming(1,    { duration: 380 }),
        ),
        -1,
        false,
      )
    } else {
      cancelAnimation(pulse)
      pulse.value = withTiming(1, { duration: 200 })
    }
  }, [isCrit])

  const animStyle = useAnimatedStyle(() => ({ opacity: pulse.value }))

  const fillStyle = useAnimatedStyle(() => {
    'worklet'
    const h  = trackH.value
    const dx = dragX.value

    if (h === 0 || Math.abs(dx) < 4) {
      return { height: h * pct, backgroundColor: color }
    }

    const delta    = dx > 0 ? acceptDelta : rejectDelta
    const progress = Math.min(1, Math.abs(dx) / SWIPE_PREVIEW_THRESHOLD)

    const projectedPct = Math.max(0, Math.min(1, (val + delta) / max))
    const displayH     = h * (pct + (projectedPct - pct) * progress)

    return { height: displayH, backgroundColor: color }
  })

  return (
    <View style={barStyles.col}>
      <Animated.Text style={[barStyles.icon, isCrit && animStyle]}>{icon}</Animated.Text>

      <View
        style={barStyles.track}
        onLayout={e => { trackH.value = e.nativeEvent.layout.height }}
      >
        <Animated.View style={[barStyles.fill, fillStyle, isCrit && animStyle]} />
      </View>

      <Animated.Text style={[barStyles.val, { color: isCrit ? themeData.colors.stat_critical : C.text_muted }, isCrit && animStyle]}>
        {displayVal > 999 ? '999+' : displayVal}
      </Animated.Text>
    </View>
  )
})

const barStyles = StyleSheet.create({
  col:   { flex: 1, alignItems: 'center', gap: 2 },
  icon:  { fontSize: 12 },
  track: {
    flex: 1, width: '100%', borderRadius: 5,
    overflow: 'hidden', justifyContent: 'flex-end',
    backgroundColor: C.card_dark,
    borderWidth: 1, borderColor: C.card_bg,
  },
  fill:  { width: '100%', borderRadius: 3 },
  val:   { fontSize: 8, fontWeight: '800' },
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

  const npc      = game.activeNPC
  const event    = game.activeEvent

  const npcAccept = useMemo(() => (npc?.accept as StatDelta | undefined) ?? {}, [npc?.npc_id])
  const npcReject = useMemo(() => (npc?.reject as StatDelta | undefined) ?? {}, [npc?.npc_id])

  const [detailsVisible,   setDetailsVisible]   = useState(false)
  const [queryResult,      setQueryResult]      = useState<string | null>(null)
  const [queryWarnPending, setQueryWarnPending] = useState(false)
  const [innerH,           setInnerH]           = useState(sh * 0.88)
  const [tutorialDone,     setTutorialDone]     = useState(false)
  const canQuery = game.queryChargesLeft > 0
  const isCompact = sh < 700

  const naturalCardH = Math.round(sw * 0.84 / CARD_ASPECT)
  const maxCardH     = Math.round((innerH - 44) * 0.58)
  const cardSlotH    = Math.min(naturalCardH, maxCardH)

  const statH   = isCompact ? 44 : 52
  const btnPadV = isCompact ? 10 : 13

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

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.colors.background }]}
      onLayout={onSafeLayout}
    >
      <AppBar onMainMenu={onMainMenu} />

      <View style={styles.center}>

        <View style={styles.spacer} />

        <View style={[styles.hud, { paddingTop: isCompact ? 4 : 8 }]}>

          <View style={styles.hudRow1}>
            <View>
              <Text style={[styles.dayNum, { color: theme.colors.text_primary }]}>
                {game.day}{L.day_num_suffix}
              </Text>
              <Text style={styles.daySub}>
                {game.day}{L.day_status_survived}{config.win_condition_day - game.day}{L.day_status_remaining}
              </Text>
            </View>
            <View style={styles.spBox}>
              <Text style={[styles.spStar, { color: theme.colors.query }]}>★</Text>
              <Text style={[styles.spNum, { color: theme.colors.text_primary }]}>{progress.sp}</Text>
              <Text style={styles.spLabel}>SP</Text>
            </View>
          </View>

          <View style={[styles.statStrip, { height: statH }]}>
            {STATS.map(s => {
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

        </View>

        <View style={[styles.cardSlot, { height: cardSlotH }]}>
          {npc && (
            <SwipeHandler
              key={npc.npc_id}
              dragX={dragX}
              onSwipeRight={() => { playSFX('sfx_accept'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); handleAccept(npc); setQueryResult(null); setQueryWarnPending(false) }}
              onSwipeLeft={()  => { playSFX('sfx_reject'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); handleReject(npc); setQueryResult(null); setQueryWarnPending(false) }}
              onSwipeUp={onQuery}
              disabled={game.phase !== 'npc_decision'}
            >
              <NPCCard npc={npc} availableHeight={cardSlotH} />
            </SwipeHandler>
          )}
        </View>

        <View style={styles.toastArea}>
          {game.phase === 'npc_decision' && queryWarnPending ? (
            <View style={[styles.queryToast, styles.queryWarnToast]}>
              <Text style={styles.queryWarnText}>
                {L.query_food_warn_prefix}{config.query_food_cost}{L.query_food_warn_suffix}
              </Text>
            </View>
          ) : game.phase === 'npc_decision' && queryResult ? (
            <View style={[styles.queryToast, { borderColor: theme.colors.query }]}>
              <Text style={[styles.queryToastText, { color: C.query }]}>
                {queryResult}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={[styles.actionBar, {
          paddingBottom: Platform.OS === 'android' ? 10 : 4,
          opacity: (npc && game.phase === 'npc_decision') ? 1 : 0,
        }]}>
          <TouchableOpacity
            onPress={() => { playSFX('sfx_reject'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); handleReject(npc!); setQueryResult(null); setQueryWarnPending(false) }}
            disabled={!npc || game.phase !== 'npc_decision'}
            style={[styles.actionBtn, styles.rejectBtn, { paddingVertical: btnPadV }]}
            activeOpacity={0.85}
          >
            <Text style={styles.rejectMark}>✕</Text>
            <Text style={[styles.actionLabel, { color: C.reject_glow }]}>{L.btn_reject}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onQuery}
            disabled={!canQuery || !npc || game.phase !== 'npc_decision'}
            style={[styles.actionBtn, styles.queryBtn, { paddingVertical: btnPadV },
              !canQuery && styles.btnDisabled,
              queryWarnPending && styles.queryBtnWarn]}
            activeOpacity={0.85}
          >
            <Text style={[styles.queryCharge, { color: queryWarnPending ? C.stat_food : canQuery ? theme.colors.query : C.text_muted }]}>
              {queryWarnPending ? '!' : game.queryChargesLeft > 0 ? game.queryChargesLeft : '✕'}
            </Text>
            <Text style={[styles.actionLabel, { color: queryWarnPending ? C.stat_food : canQuery ? theme.colors.query : C.text_muted }]}>
              {queryWarnPending ? L.btn_query_confirm : L.btn_query}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setDetailsVisible(true)}
            disabled={!npc || game.phase !== 'npc_decision'}
            style={[styles.actionBtn, styles.detailBtn, { paddingVertical: btnPadV }]}
            activeOpacity={0.85}
          >
            <Text style={[styles.detailMark, { color: C.text_muted }]}>i</Text>
            <Text style={[styles.actionLabel, { color: C.text_muted }]}>{L.btn_detail}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => { playSFX('sfx_accept'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); handleAccept(npc!); setQueryResult(null); setQueryWarnPending(false) }}
            disabled={!npc || game.phase !== 'npc_decision'}
            style={[styles.actionBtn, styles.acceptBtn, { paddingVertical: btnPadV }]}
            activeOpacity={0.85}
          >
            <Text style={styles.acceptMark}>✓</Text>
            <Text style={[styles.actionLabel, { color: C.accept_glow }]}>{L.btn_accept}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.spacer} />

      </View>

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
  center: { flex: 1 },
  spacer: { flex: 1 },

  hud: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    paddingTop: 4,
    gap: 6,
    backgroundColor: themeData.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: themeData.colors.divider,
  },
  hudRow1: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayNum: { fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
  daySub: { fontSize: 9, letterSpacing: 0.2, marginTop: 1, color: themeData.colors.text_secondary },
  spBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: C.card_bg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.button_border,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  spStar:  { fontSize: 14 },
  spNum:   { fontSize: 17, fontWeight: '800' },
  spLabel: { fontSize: 10, fontWeight: '700', color: C.text_secondary },

  statStrip: { flexDirection: 'row', gap: 5 },

  cardSlot: { justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },

  toastArea: { height: 50, paddingHorizontal: 16, justifyContent: 'center' },
  queryToast: {
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 10, borderWidth: 1,
    backgroundColor: C.surface,
  },
  queryToastText: { fontSize: 12, lineHeight: 18 },
  queryWarnToast: { backgroundColor: C.surface, borderColor: themeData.colors.stat_food },
  queryWarnText:  { color: C.query, fontSize: 11, fontWeight: '700', lineHeight: 16 },

  actionBar: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 6,
    backgroundColor: themeData.colors.surface,
    borderTopWidth: 1,
    borderTopColor: themeData.colors.divider,
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    gap: 3,
    borderWidth: 1,
  },
  rejectBtn:    { backgroundColor: '#2d1a1a', borderColor: C.border_neg },
  queryBtn:     { backgroundColor: '#2d2515', borderColor: C.border_warn },
  queryBtnWarn: { backgroundColor: '#2d2010', borderColor: themeData.colors.stat_food },
  detailBtn:    { backgroundColor: C.card_bg, borderColor: C.divider },
  acceptBtn:    { backgroundColor: '#1a2d1a', borderColor: C.border_pos },
  btnDisabled:  { opacity: 0.35 },

  rejectMark:  { fontSize: 20, color: themeData.colors.reject_glow, fontWeight: '900' },
  acceptMark:  { fontSize: 20, color: themeData.colors.accept_glow, fontWeight: '900' },
  queryCharge: { fontSize: 18, fontWeight: '900' },
  detailMark:  { fontSize: 18, fontWeight: '900', fontStyle: 'italic' },
  actionLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
})
