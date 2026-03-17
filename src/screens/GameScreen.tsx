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

// ─── Single stat row ────────────────────────────────────────────────────────
const StatRow = React.memo<{
  icon:        string
  abbrev:      string
  val:         number
  pct:         number
  isCrit:      boolean
  color:       string
  acceptDelta: number
  rejectDelta: number
  max:         number
  dragX:       SharedValue<number>
}>(({ icon, abbrev, val, pct, isCrit, color, acceptDelta, rejectDelta, max, dragX }) => {

  const pulse  = useSharedValue(1)
  const trackW = useSharedValue(0)
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
        withSequence(withTiming(0.08, { duration: 320 }), withTiming(1, { duration: 320 })),
        -1, false,
      )
    } else {
      cancelAnimation(pulse)
      pulse.value = withTiming(1, { duration: 180 })
    }
  }, [isCrit])

  const blinkStyle  = useAnimatedStyle(() => ({ opacity: pulse.value }))
  const activeColor = isCrit ? C.stat_critical : color

  const fillStyle = useAnimatedStyle(() => {
    'worklet'
    const w  = trackW.value
    const dx = dragX.value
    if (w === 0 || Math.abs(dx) < 4) return { width: w * pct, backgroundColor: activeColor }
    const delta        = dx > 0 ? acceptDelta : rejectDelta
    const progress     = Math.min(1, Math.abs(dx) / SWIPE_THRESHOLD)
    const projPct      = Math.max(0, Math.min(1, (val + delta) / max))
    return { width: w * (pct + (projPct - pct) * progress), backgroundColor: activeColor }
  })

  return (
    <View style={sRow.wrap}>
      <Text style={sRow.icon}>{icon}</Text>
      <Text style={[sRow.abbrev, { color: isCrit ? C.stat_critical : C.text_muted }, isCrit && blinkStyle as any]}>
        {abbrev}
      </Text>
      <View style={[sRow.track, { borderColor: activeColor + '28' }]}
        onLayout={e => { trackW.value = e.nativeEvent.layout.width }}>
        <Animated.View style={[sRow.fill, fillStyle]} />
        {isCrit && <Animated.View style={[sRow.critFlash, blinkStyle]} />}
      </View>
      <Animated.Text style={[sRow.val, { color: isCrit ? C.stat_critical : activeColor }, isCrit && blinkStyle]}>
        {displayVal > 999 ? '999' : displayVal}
      </Animated.Text>
    </View>
  )
})

const sRow = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  icon:   { fontSize: 10, width: 14, textAlign: 'center' },
  abbrev: { fontSize: TY.size_caption, fontWeight: TY.weight_black, fontFamily: MONO, letterSpacing: 0.5, width: 28 },
  track: {
    flex: 1, height: 6, borderRadius: 3,
    overflow: 'hidden', borderWidth: 1,
    backgroundColor: C.card_dark,
  },
  fill:      { height: '100%', borderRadius: 3 },
  critFlash: { ...StyleSheet.absoluteFillObject, backgroundColor: C.stat_critical + '22' },
  val: {
    fontSize: TY.size_caption, fontWeight: TY.weight_black,
    fontFamily: MONO, width: 26, textAlign: 'right',
  },
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

  // HUD ~100px + infoBar ~34px + toast ~38px + actions ~100px = ~272
  const naturalCardH = Math.round(sw * 0.84 / CARD_ASPECT)
  const maxCardH     = Math.max(180, innerH - (isCompact ? 255 : 280))
  const cardSlotH    = Math.min(naturalCardH, maxCardH)

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
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]} onLayout={onSafeLayout}>
      <AppBar onMainMenu={onMainMenu} />

      {/* ── TACTICAL STATUS HUD ────────────────────────────── */}
      <View style={styles.hud}>
        <View style={styles.hudHeader}>
          <View style={styles.hudHeaderLine} />
          <Text style={[styles.hudHeaderText, { fontFamily: MONO }]}>DURUM MONİTÖRÜ</Text>
          <View style={styles.hudHeaderLine} />
        </View>

        {/* 3 + 2 grid */}
        <View style={styles.statRow}>
          {STATS.slice(0, 3).map(s => (
            <StatRow key={s}
              icon={(UI.stat_icons as any)[s]}
              abbrev={(UI.stat_abbrevs as any)[s]}
              val={Math.round(stats.stats[s])}
              pct={Math.min(1, Math.max(0, stats.stats[s] / STAT_MAX[s]))}
              isCrit={stats.isCritical(s)}
              color={(UI.stat_colors as any)[s]}
              acceptDelta={npcAccept[s] ?? 0}
              rejectDelta={npcReject[s] ?? 0}
              max={STAT_MAX[s]}
              dragX={dragX}
            />
          ))}
        </View>
        <View style={styles.statRow}>
          {STATS.slice(3).map(s => (
            <StatRow key={s}
              icon={(UI.stat_icons as any)[s]}
              abbrev={(UI.stat_abbrevs as any)[s]}
              val={Math.round(stats.stats[s])}
              pct={Math.min(1, Math.max(0, stats.stats[s] / STAT_MAX[s]))}
              isCrit={stats.isCritical(s)}
              color={(UI.stat_colors as any)[s]}
              acceptDelta={npcAccept[s] ?? 0}
              rejectDelta={npcReject[s] ?? 0}
              max={STAT_MAX[s]}
              dragX={dragX}
            />
          ))}
          {/* spacer to fill 3rd col */}
          <View style={{ flex: 1 }} />
        </View>
      </View>

      {/* ── MISSION INFO BAR ───────────────────────────────── */}
      <View style={styles.infoBar}>
        {/* day counter */}
        <View style={styles.infoBlock}>
          <Text style={[styles.infoLabel, { fontFamily: MONO }]}>GÜN</Text>
          <Text style={[styles.infoVal,   { fontFamily: MONO, color: C.accept_glow }]}>
            {String(game.day).padStart(2, '0')}
            <Text style={[styles.infoValSub, { fontFamily: MONO }]}>/{config.win_condition_day}</Text>
          </Text>
        </View>

        {/* progress bar */}
        <View style={styles.missionTrackWrap}>
          <Text style={[styles.infoLabel, { fontFamily: MONO, textAlign: 'center' }]}>MİSYON İLERLEMESİ</Text>
          <View style={styles.missionTrack}>
            <View style={[styles.missionFill, { width: `${dayPct}%` as any }]} />
            <Text style={[styles.missionPct, { fontFamily: MONO }]}>{dayPct}%</Text>
          </View>
        </View>

        {/* SP */}
        <View style={[styles.infoBlock, { alignItems: 'flex-end' }]}>
          <Text style={[styles.infoLabel, { fontFamily: MONO }]}>PUAN</Text>
          <Text style={[styles.infoVal,   { fontFamily: MONO, color: C.query }]}>
            {progress.sp}<Text style={[styles.infoValSub, { fontFamily: MONO }]}> SP</Text>
          </Text>
        </View>
      </View>

      {/* ── SUBJECT CARD ───────────────────────────────────── */}
      <View style={[styles.cardZone, { height: cardSlotH }]}>
        {/* scan frame corners */}
        {(['tl','tr','bl','br'] as const).map(p => <ScanCorner key={p} pos={p} />)}

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

      {/* ── ALERT / QUERY TOAST ────────────────────────────── */}
      <View style={styles.toastZone}>
        {isDecision && queryWarnPending ? (
          <View style={[styles.alertBox, { borderColor: C.query, backgroundColor: C.query + '14' }]}>
            <Text style={[styles.alertIcon, { color: C.query }]}>⚠</Text>
            <Text style={[styles.alertText, { color: C.query, fontFamily: MONO }]}>
              {L.query_food_warn_prefix}{config.query_food_cost}{L.query_food_warn_suffix}
            </Text>
            <Text style={[styles.alertIcon, { color: C.query }]}>⚠</Text>
          </View>
        ) : isDecision && queryResult ? (
          <View style={[styles.alertBox, { borderColor: C.accept, backgroundColor: C.accept + '10' }]}>
            <Text style={[styles.alertIcon, { color: C.accept }]}>▶</Text>
            <Text style={[styles.alertText, { color: C.accept_glow, fontFamily: MONO }]}>{queryResult}</Text>
          </View>
        ) : null}
      </View>

      {/* ── CONTROL PANEL ──────────────────────────────────── */}
      <View style={[styles.panel, {
        paddingBottom: Platform.OS === 'android' ? 14 : 8,
        opacity: isDecision ? 1 : 0,
      }]}>
        {/* utility strip */}
        <View style={styles.utilStrip}>
          <View style={styles.utilStripLine} />
          <TouchableOpacity
            onPress={onQuery}
            disabled={!canQuery || !isDecision}
            style={[styles.utilChip, !canQuery && styles.utilChipOff, queryWarnPending && styles.utilChipWarn]}
            activeOpacity={0.75}
          >
            <Text style={[styles.utilChipText, {
              color: queryWarnPending ? C.query : canQuery ? C.query : C.text_muted,
              fontFamily: MONO,
            }]}>
              {queryWarnPending ? `⚠ ${L.btn_query_confirm}` : `🔬 ${L.btn_query} ×${game.queryChargesLeft}`}
            </Text>
          </TouchableOpacity>

          <View style={styles.utilStripDot} />

          <TouchableOpacity
            onPress={() => setDetailsVisible(true)}
            disabled={!isDecision}
            style={styles.utilChip}
            activeOpacity={0.75}
          >
            <Text style={[styles.utilChipText, { color: C.text_muted, fontFamily: MONO }]}>
              📋 {L.btn_detail}
            </Text>
          </TouchableOpacity>
          <View style={styles.utilStripLine} />
        </View>

        {/* main action buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity onPress={doReject} disabled={!isDecision}
            style={[styles.actionBtn, styles.actionReject]} activeOpacity={0.72}>
            <View style={styles.actionBtnInner}>
              <Text style={[styles.actionBtnSymbol, { color: C.danger }]}>✕</Text>
              <View>
                <Text style={[styles.actionBtnCode,  { color: C.danger,      fontFamily: MONO }]}>CMD-01</Text>
                <Text style={[styles.actionBtnLabel, { color: C.reject_glow, fontFamily: MONO }]}>{L.btn_reject}</Text>
              </View>
            </View>
            <View style={[styles.actionBtnGlow, { backgroundColor: C.danger + '18' }]} />
          </TouchableOpacity>

          <TouchableOpacity onPress={doAccept} disabled={!isDecision}
            style={[styles.actionBtn, styles.actionAccept]} activeOpacity={0.72}>
            <View style={styles.actionBtnInner}>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.actionBtnCode,  { color: C.accept,      fontFamily: MONO }]}>CMD-02</Text>
                <Text style={[styles.actionBtnLabel, { color: C.accept_glow, fontFamily: MONO }]}>{L.btn_accept}</Text>
              </View>
              <Text style={[styles.actionBtnSymbol, { color: C.accept_glow }]}>✓</Text>
            </View>
            <View style={[styles.actionBtnGlow, { backgroundColor: C.accept + '14' }]} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── overlays ───────────────────────────────────────── */}
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

// ─── Scan corner bracket ────────────────────────────────────────────────────
const ScanCorner: React.FC<{ pos: 'tl' | 'tr' | 'bl' | 'br' }> = ({ pos }) => {
  const isTop  = pos === 'tl' || pos === 'tr'
  const isLeft = pos === 'tl' || pos === 'bl'
  const sz = 18; const th = 2
  return (
    <View pointerEvents="none" style={{
      position: 'absolute',
      top:    isTop  ? 4 : undefined,
      bottom: !isTop ? 4 : undefined,
      left:   isLeft  ? 4 : undefined,
      right:  !isLeft ? 4 : undefined,
      width: sz, height: sz,
    }}>
      <View style={{ position:'absolute', top: isTop ? 0 : undefined, bottom: !isTop ? 0 : undefined, left:0, right:0, height:th, backgroundColor: C.accept + '99' }} />
      <View style={{ position:'absolute', left: isLeft ? 0 : undefined, right: !isLeft ? 0 : undefined, top:0, bottom:0, width:th, backgroundColor: C.accept + '99' }} />
    </View>
  )
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1 },

  // HUD
  hud: {
    paddingHorizontal: SP.sm,
    paddingTop: 6,
    paddingBottom: 8,
    gap: 5,
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.accept + '22',
  },
  hudHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  hudHeaderLine: { flex: 1, height: 1, backgroundColor: C.accept + '30' },
  hudHeaderText: {
    color: C.accept + '60',
    fontSize: TY.size_caption,
    fontWeight: TY.weight_heavy,
    letterSpacing: 3,
  },
  statRow: {
    flexDirection: 'row',
    gap: SP.sm,
  },

  // mission info bar
  infoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SP.sm,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: C.divider,
    backgroundColor: C.bg_deeper,
    gap: SP.sm,
  },
  infoBlock: { minWidth: 44 },
  infoLabel: {
    color: C.text_muted,
    fontSize: 7,
    fontWeight: TY.weight_heavy,
    letterSpacing: 2,
    marginBottom: 1,
  },
  infoVal: {
    fontSize: TY.size_h6,
    fontWeight: TY.weight_black,
  },
  infoValSub: {
    fontSize: TY.size_caption,
    fontWeight: TY.weight_bold,
    color: C.text_muted,
  },
  missionTrackWrap: { flex: 1, gap: 2 },
  missionTrack: {
    height: 10,
    borderRadius: 3,
    overflow: 'hidden',
    backgroundColor: C.card_dark,
    borderWidth: 1,
    borderColor: C.accept + '30',
    justifyContent: 'center',
  },
  missionFill: {
    ...StyleSheet.absoluteFillObject,
    right: undefined,
    backgroundColor: C.accept + '55',
    borderRadius: 3,
  },
  missionPct: {
    color: C.accept_glow,
    fontSize: 7,
    fontWeight: TY.weight_black,
    letterSpacing: 1,
    textAlign: 'center',
  },

  // card zone
  cardZone: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginVertical: 2,
  },

  // toast
  toastZone: { height: 38, paddingHorizontal: SP.md, justifyContent: 'center' },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: SP.md,
    paddingVertical: 6,
    borderRadius: R.xs,
    borderWidth: 1,
    alignSelf: 'center',
  },
  alertIcon: { fontSize: TY.size_sm },
  alertText: { fontSize: TY.size_xs, letterSpacing: 0.4, fontWeight: TY.weight_heavy },

  // control panel
  panel: {
    paddingHorizontal: SP.sm,
    paddingTop: 4,
    gap: 4,
  },

  utilStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  utilStripLine: { flex: 1, height: 1, backgroundColor: C.divider },
  utilStripDot:  { width: 4, height: 4, borderRadius: 2, backgroundColor: C.accept + '50' },
  utilChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: R.xs,
    borderWidth: 1,
    backgroundColor: C.card_dark,
    borderColor: C.divider,
  },
  utilChipWarn:  { borderColor: C.query,    backgroundColor: C.query    + '14' },
  utilChipOff:   { opacity: 0.3 },
  utilChipText:  { fontSize: TY.size_xs, fontWeight: TY.weight_heavy, letterSpacing: 0.5 },

  actionRow: { flexDirection: 'row', gap: 5 },
  actionBtn: {
    flex: 1,
    borderRadius: R.md,
    borderWidth: 2,
    overflow: 'hidden',
  },
  actionBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 10,
    zIndex: 1,
  },
  actionBtnGlow: {
    ...StyleSheet.absoluteFillObject,
  },
  actionReject: {
    borderColor: C.danger,
    backgroundColor: C.danger_dark,
    shadowColor: C.danger,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 8,
  },
  actionAccept: {
    borderColor: C.accept,
    backgroundColor: C.accept + '10',
    shadowColor: C.accept_glow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  actionBtnSymbol: { fontSize: TY.size_xl, fontWeight: TY.weight_black },
  actionBtnCode:   { fontSize: 8, fontWeight: TY.weight_heavy, letterSpacing: 2, opacity: 0.6 },
  actionBtnLabel:  { fontSize: TY.size_sm, fontWeight: TY.weight_black, letterSpacing: 1.5 },
})

