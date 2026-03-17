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
const MONO     = Platform.select(themeData.ui.font_mono) as string

const SWIPE_PREVIEW_THRESHOLD = themeData.animation.swipe_threshold

// ─── Stat bar (horizontal, monitor style) ───────────────────────────────────
const StatBarItem = React.memo<{
  icon:        string
  label:       string
  val:         number
  pct:         number
  isCrit:      boolean
  color:       string
  acceptDelta: number
  rejectDelta: number
  max:         number
  dragX:       SharedValue<number>
}>(({ icon, label, val, pct, isCrit, color, acceptDelta, rejectDelta, max, dragX }) => {

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
          withTiming(0.1, { duration: 350 }),
          withTiming(1,   { duration: 350 }),
        ), -1, false)
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

  const activeColor = isCrit ? C.stat_critical : color

  return (
    <View style={barS.wrap}>
      {/* label row */}
      <View style={barS.labelRow}>
        <Text style={[barS.icon]}>{icon}</Text>
        <Text style={[barS.label, { color: isCrit ? C.stat_critical : C.text_muted }, isCrit && animStyle as any]}>
          {label}
        </Text>
        <Animated.Text style={[barS.val, { color: isCrit ? C.stat_critical : activeColor }, isCrit && animStyle]}>
          {displayVal > 99 ? '99+' : displayVal}
        </Animated.Text>
      </View>
      {/* bar track */}
      <View style={[barS.track, { borderColor: activeColor + '30' }]}
        onLayout={e => { trackW.value = e.nativeEvent.layout.width }}>
        <Animated.View style={[barS.fill, fillStyle]} />
        {isCrit && (
          <Animated.View style={[barS.critOverlay, animStyle]} />
        )}
      </View>
    </View>
  )
})

const barS = StyleSheet.create({
  wrap: { flex: 1 },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 3,
  },
  icon:  { fontSize: 9 },
  label: { flex: 1, fontSize: TY.size_caption, fontWeight: TY.weight_heavy, fontFamily: MONO, letterSpacing: 0.8 },
  val:   { fontSize: TY.size_caption, fontWeight: TY.weight_black, fontFamily: MONO, minWidth: 22, textAlign: 'right' },
  track: {
    height: 7, borderRadius: 2, overflow: 'hidden',
    backgroundColor: C.card_dark,
    borderWidth: 1,
  },
  fill: { height: '100%', borderRadius: 2 },
  critOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: C.stat_critical + '25',
  },
})

// ─── Corner bracket decoration ───────────────────────────────────────────────
const Corner: React.FC<{ pos: 'tl' | 'tr' | 'bl' | 'br'; color: string }> = ({ pos, color }) => {
  const isTop    = pos === 'tl' || pos === 'tr'
  const isLeft   = pos === 'tl' || pos === 'bl'
  const s = 14
  const t = 2
  return (
    <View style={{
      position: 'absolute',
      top:    isTop  ? 0 : undefined,
      bottom: !isTop ? 0 : undefined,
      left:   isLeft  ? 0 : undefined,
      right:  !isLeft ? 0 : undefined,
      width: s, height: s,
    }}>
      {/* horizontal */}
      <View style={{
        position: 'absolute',
        top:    isTop  ? 0 : undefined,
        bottom: !isTop ? 0 : undefined,
        left: 0, right: 0, height: t,
        backgroundColor: color,
      }} />
      {/* vertical */}
      <View style={{
        position: 'absolute',
        left:  isLeft  ? 0 : undefined,
        right: !isLeft ? 0 : undefined,
        top: 0, bottom: 0, width: t,
        backgroundColor: color,
      }} />
    </View>
  )
}

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
  const usedH        = isCompact ? 190 : 210
  const maxCardH     = Math.max(160, innerH - usedH)
  const cardSlotH    = Math.min(naturalCardH, maxCardH)

  const dayPct = (game.day - 1) / (config.win_condition_day - 1)

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

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.colors.background }]}
      onLayout={onSafeLayout}
    >
      <AppBar onMainMenu={onMainMenu} />

      {/* ── HUD: stat monitor ─────────────────────────────── */}
      <View style={styles.hud}>
        {/* left: stat grid */}
        <View style={styles.statGrid}>
          {STATS.map(s => (
            <StatBarItem
              key={s}
              icon={(UI.stat_icons as any)[s]}
              label={(UI.stat_abbrevs as any)[s] ?? s.slice(0, 3).toUpperCase()}
              val={Math.round(stats.stats[s])}
              pct={Math.min(1, Math.max(0, stats.stats[s] / STAT_MAX[s]))}
              isCrit={stats.isCritical(s)}
              color={stats.isCritical(s) ? C.stat_critical : (UI.stat_colors as any)[s]}
              acceptDelta={npcAccept[s] ?? 0}
              rejectDelta={npcReject[s] ?? 0}
              max={STAT_MAX[s]}
              dragX={dragX}
            />
          ))}
        </View>

        {/* right: terminal readout */}
        <View style={styles.readout}>
          <Text style={[styles.readoutLabel, { fontFamily: MONO }]}>GÜN</Text>
          <Text style={[styles.readoutBig,   { fontFamily: MONO }]}>{game.day}</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.round(dayPct * 100)}%` as any }]} />
          </View>
          <Text style={[styles.readoutSub,   { fontFamily: MONO }]}>
            /{config.win_condition_day}
          </Text>
          <View style={styles.readoutDivider} />
          <Text style={[styles.readoutLabel, { fontFamily: MONO }]}>SP</Text>
          <Text style={[styles.readoutSp,    { fontFamily: MONO }]}>{progress.sp}</Text>
        </View>
      </View>

      {/* ── card area ─────────────────────────────────────── */}
      <View style={[styles.cardSlot, { height: cardSlotH }]}>
        {/* targeting corner brackets */}
        <Corner pos="tl" color={C.accept_glow + '88'} />
        <Corner pos="tr" color={C.accept_glow + '88'} />
        <Corner pos="bl" color={C.accept_glow + '44'} />
        <Corner pos="br" color={C.accept_glow + '44'} />

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
          <View style={[styles.toast, { borderColor: C.query, backgroundColor: C.query + '18' }]}>
            <Text style={[styles.toastIcon, { color: C.query }]}>⚠</Text>
            <Text style={[styles.toastText, { color: C.query, fontFamily: MONO }]}>
              {L.query_food_warn_prefix}{config.query_food_cost}{L.query_food_warn_suffix}
            </Text>
          </View>
        ) : isDecision && queryResult ? (
          <View style={[styles.toast, { borderColor: C.accept, backgroundColor: C.accept + '12' }]}>
            <Text style={[styles.toastIcon, { color: C.accept }]}>▶</Text>
            <Text style={[styles.toastText, { color: C.accept_glow, fontFamily: MONO }]}>{queryResult}</Text>
          </View>
        ) : null}
      </View>

      {/* ── action bar ─────────────────────────────────────── */}
      <View style={[styles.actions, {
        paddingBottom: Platform.OS === 'android' ? 14 : 8,
        opacity: isDecision ? 1 : 0,
      }]}>
        {/* utility row */}
        <View style={styles.utilRow}>
          <TouchableOpacity
            onPress={onQuery}
            disabled={!canQuery || !isDecision}
            style={[styles.utilBtn, !canQuery && styles.btnOff, queryWarnPending && styles.queryWarn]}
            activeOpacity={0.8}
          >
            <Text style={[styles.utilIcon, {
              color: queryWarnPending ? C.query : canQuery ? C.query : C.text_muted,
              fontFamily: MONO,
            }]}>
              {queryWarnPending ? '⚠' : canQuery ? `🔬×${game.queryChargesLeft}` : '✕'}
            </Text>
            <Text style={[styles.utilLabel, {
              color: queryWarnPending ? C.query : canQuery ? C.query : C.text_muted,
              fontFamily: MONO,
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
            <Text style={[styles.utilIcon, { color: C.text_muted, fontFamily: MONO }]}>📋</Text>
            <Text style={[styles.utilLabel, { color: C.text_muted, fontFamily: MONO }]}>{L.btn_detail}</Text>
          </TouchableOpacity>
        </View>

        {/* main buttons */}
        <View style={styles.mainRow}>
          <TouchableOpacity
            onPress={doReject}
            disabled={!isDecision}
            style={[styles.mainBtn, styles.rejectBtn]}
            activeOpacity={0.7}
          >
            <Text style={[styles.mainBtnMark, { color: C.danger }]}>✕</Text>
            <Text style={[styles.mainBtnLabel, { color: C.danger, fontFamily: MONO }]}>
              {L.btn_reject}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={doAccept}
            disabled={!isDecision}
            style={[styles.mainBtn, styles.acceptBtn]}
            activeOpacity={0.7}
          >
            <Text style={[styles.mainBtnMark, { color: C.accept_glow }]}>✓</Text>
            <Text style={[styles.mainBtnLabel, { color: C.accept_glow, fontFamily: MONO }]}>
              {L.btn_accept}
            </Text>
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

  // ── HUD
  hud: {
    flexDirection: 'row',
    gap: SP.sm,
    paddingHorizontal: SP.sm,
    paddingVertical: SP.sm,
    borderBottomWidth: 1,
    borderBottomColor: C.accept + '20',
    backgroundColor: C.surface,
  },
  statGrid: {
    flex: 1,
    flexDirection: 'row',
    gap: 5,
  },

  // terminal readout box
  readout: {
    width: 54,
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderRadius: R.sm,
    borderWidth: 1,
    borderColor: C.accept + '30',
    backgroundColor: C.card_dark,
    gap: 1,
  },
  readoutLabel: {
    color: C.text_muted,
    fontSize: 7,
    fontWeight: TY.weight_heavy,
    letterSpacing: 1.5,
  },
  readoutBig: {
    color: C.accept_glow,
    fontSize: TY.size_h5,
    fontWeight: TY.weight_black,
    lineHeight: 22,
  },
  progressTrack: {
    width: '100%',
    height: 3,
    borderRadius: 2,
    backgroundColor: C.card_bg,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: C.accept,
    borderRadius: 2,
  },
  readoutSub: {
    color: C.text_muted,
    fontSize: 8,
    fontWeight: TY.weight_bold,
  },
  readoutDivider: {
    width: '80%',
    height: 1,
    backgroundColor: C.divider,
    marginVertical: 3,
  },
  readoutSp: {
    color: C.query,
    fontSize: TY.size_md,
    fontWeight: TY.weight_black,
  },

  // ── card
  cardSlot: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginVertical: 4,
  },

  // ── toast
  toastArea: { height: 40, paddingHorizontal: SP.md, justifyContent: 'center' },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SP.md,
    paddingVertical: 7,
    borderRadius: R.sm,
    borderWidth: 1,
    alignSelf: 'center',
  },
  toastIcon: { fontSize: TY.size_sm },
  toastText: { fontSize: TY.size_xs, letterSpacing: 0.3 },

  // ── actions
  actions: {
    paddingHorizontal: SP.sm,
    paddingTop: 4,
    gap: 5,
  },
  utilRow: { flexDirection: 'row', gap: 5 },
  utilBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, paddingVertical: 7,
    borderRadius: R.sm, borderWidth: 1,
    backgroundColor: C.card_dark, borderColor: C.divider,
  },
  queryWarn:  { borderColor: C.query, backgroundColor: C.query + '15' },
  btnOff:     { opacity: 0.28 },
  utilIcon:   { fontSize: TY.size_sm },
  utilLabel:  { fontSize: TY.size_caption, fontWeight: TY.weight_heavy, letterSpacing: 0.5 },

  mainRow: { flexDirection: 'row', gap: 5 },
  mainBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6,
    borderRadius: R.md, borderWidth: 2,
    paddingTop: 12, paddingBottom: 12,
  },
  rejectBtn: {
    backgroundColor: C.danger_dark,
    borderColor: C.danger,
    shadowColor: C.danger,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  acceptBtn: {
    backgroundColor: C.accept + '18',
    borderColor: C.accept,
    shadowColor: C.accept,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  mainBtnMark:  { fontSize: TY.size_lg, fontWeight: TY.weight_black },
  mainBtnLabel: { fontSize: TY.size_sm,  fontWeight: TY.weight_black, letterSpacing: 1 },
})
