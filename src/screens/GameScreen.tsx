import React, { useState, useCallback, useEffect } from 'react'
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

// ─── Animasyonlu stat bar ────────────────────────────────────────────────────
// isCrit → yanıp söner
// dragX  → swipe yönüne göre bar yüksekliği hedef değere doğru kayar

const StatBarItem: React.FC<{
  icon:         string
  val:          number
  pct:          number          // mevcut doluluk oranı [0‥1]
  isCrit:       boolean
  color:        string
  acceptDelta:  number          // kabul edilirse stat değişimi
  rejectDelta:  number          // reddedilirse stat değişimi
  max:          number          // bu stat'ın maksimum değeri
  dragX:        SharedValue<number>
}> = ({ icon, val, pct, isCrit, color, acceptDelta, rejectDelta, max, dragX }) => {

  const pulse  = useSharedValue(1)
  const trackH = useSharedValue(0)   // onLayout ile ölçülür, worklet'te kullanılır

  // Swipe sırasında gösterilecek değer (JS thread)
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

  // Kritik → yanıp sön animasyonu
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

  // ── Reigns-style bar animasyonu ──────────────────────────────────────────
  // dragX > 0  → sağa (kabul) kaydırılıyor: acceptDelta uygula
  // dragX < 0  → sola (ret)   kaydırılıyor: rejectDelta uygula
  // İlerleme oranı [0‥1] SWIPE_PREVIEW_THRESHOLD'a göre normalize edilir
  const fillStyle = useAnimatedStyle(() => {
    'worklet'
    const h  = trackH.value
    const dx = dragX.value

    // Track henüz ölçülmediyse ya da sürükleme yoksa statik göster
    if (h === 0 || Math.abs(dx) < 4) {
      return { height: h * pct, backgroundColor: color }
    }

    const delta    = dx > 0 ? acceptDelta : rejectDelta
    const progress = Math.min(1, Math.abs(dx) / SWIPE_PREVIEW_THRESHOLD)

    // Hedef doluluk oranı
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

      <Animated.Text style={[barStyles.val, { color: isCrit ? themeData.colors.stat_critical : '#5a4a38' }, isCrit && animStyle]}>
        {displayVal > 999 ? '999+' : displayVal}
      </Animated.Text>
    </View>
  )
}

const barStyles = StyleSheet.create({
  col:   { flex: 1, alignItems: 'center', gap: 2 },
  icon:  { fontSize: 12 },
  track: {
    flex: 1, width: '100%', borderRadius: 4,
    overflow: 'hidden', justifyContent: 'flex-end',
    backgroundColor: '#1a1410',
    borderWidth: 1, borderColor: '#2a1e14',
  },
  fill:  { width: '100%', borderRadius: 3 },
  val:   { fontSize: 8, fontWeight: '800' },
})

// ─────────────────────────────────────────────────────────────────────────────

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

  // SwipeHandler ile paylaşılan drag değeri → stat bar önizlemesi için
  const dragX = useSharedValue(0)

  const [detailsVisible,   setDetailsVisible]   = useState(false)
  const [queryResult,      setQueryResult]      = useState<string | null>(null)
  const [queryWarnPending, setQueryWarnPending] = useState(false)
  const [innerH,           setInnerH]           = useState(sh * 0.88)
  const [tutorialDone,     setTutorialDone]     = useState(false)

  const npc      = game.activeNPC
  const event    = game.activeEvent
  const canQuery = game.queryChargesLeft > 0
  const isCompact = sh < 700

  const naturalCardH = Math.round(sw * 0.84 / CARD_ASPECT)
  const maxCardH     = Math.round((innerH - 44) * 0.58)
  const cardSlotH    = Math.min(naturalCardH, maxCardH)

  const statH   = isCompact ? 44 : 52
  const btnPadV = isCompact ? 10 : 13

  // npc_arrival fazında bildirim yoksa otomatik geç
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

        {/* ── HUD ── */}
        <View style={[styles.hud, { paddingTop: isCompact ? 4 : 8 }]}>

          {/* Gün + SP */}
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

          {/* Stat barlar — dragX paylaşılır, swipe'a göre önizleme gösterilir */}
          <View style={[styles.statStrip, { height: statH }]}>
            {STATS.map(s => {
              const val        = Math.round(stats.stats[s])
              const pct        = Math.min(1, Math.max(0, val / STAT_MAX[s]))
              const isCrit     = stats.isCritical(s)
              const color      = isCrit ? C.stat_critical : (UI.stat_colors as any)[s]
              const accept     = (npc?.accept as StatDelta | undefined) ?? {}
              const reject     = (npc?.reject as StatDelta | undefined) ?? {}
              return (
                <StatBarItem
                  key={s}
                  icon={(UI.stat_icons as any)[s]}
                  val={val}
                  pct={pct}
                  isCrit={isCrit}
                  color={color}
                  acceptDelta={accept[s] ?? 0}
                  rejectDelta={reject[s] ?? 0}
                  max={STAT_MAX[s]}
                  dragX={dragX}
                />
              )
            })}
          </View>

        </View>

        {/* ── Kart ── */}
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

        {/* ── Toast ── */}
        <View style={styles.toastArea}>
          {game.phase === 'npc_decision' && queryWarnPending ? (
            <View style={[styles.queryToast, styles.queryWarnToast]}>
              <Text style={styles.queryWarnText}>
                {L.query_food_warn_prefix}{config.query_food_cost}{L.query_food_warn_suffix}
              </Text>
            </View>
          ) : game.phase === 'npc_decision' && queryResult ? (
            <View style={[styles.queryToast, { borderColor: theme.colors.query }]}>
              <Text style={[styles.queryToastText, { color: '#ffb300' }]}>
                {queryResult}
              </Text>
            </View>
          ) : null}
        </View>

        {/* ── Aksiyon butonları ── */}
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
            <Text style={[styles.queryCharge, { color: queryWarnPending ? C.stat_food : canQuery ? theme.colors.query : '#2a2a2a' }]}>
              {queryWarnPending ? '!' : game.queryChargesLeft > 0 ? game.queryChargesLeft : '✕'}
            </Text>
            <Text style={[styles.actionLabel, { color: queryWarnPending ? C.stat_food : canQuery ? theme.colors.query : '#2a2a2a' }]}>
              {queryWarnPending ? L.btn_query_confirm : L.btn_query}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setDetailsVisible(true)}
            disabled={!npc || game.phase !== 'npc_decision'}
            style={[styles.actionBtn, styles.detailBtn, { paddingVertical: btnPadV }]}
            activeOpacity={0.85}
          >
            <Text style={[styles.detailMark, { color: '#555' }]}>i</Text>
            <Text style={[styles.actionLabel, { color: '#555' }]}>{L.btn_detail}</Text>
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

      {/* Overlays */}
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
    backgroundColor: '#0e0a07',
    borderBottomWidth: 1,
    borderBottomColor: '#1e1510',
  },
  hudRow1: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayNum: { fontSize: 15, fontWeight: '800', letterSpacing: 0.3 },
  daySub: { fontSize: 9, letterSpacing: 0.2, marginTop: 1, color: '#5a4a38' },
  spBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#150e00',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2a1c00',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  spStar:  { fontSize: 13 },
  spNum:   { fontSize: 16, fontWeight: '800' },
  spLabel: { fontSize: 10, fontWeight: '700', color: '#44350a' },

  statStrip: { flexDirection: 'row', gap: 5 },

  cardSlot: { justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },

  toastArea: { height: 50, paddingHorizontal: 16, justifyContent: 'center' },
  queryToast: {
    paddingHorizontal: 12, paddingVertical: 9,
    borderRadius: 8, borderWidth: 1,
    backgroundColor: '#0d0800',
  },
  queryToastText: { fontSize: 12, lineHeight: 18 },
  queryWarnToast: { backgroundColor: '#120800', borderColor: themeData.colors.stat_food },
  queryWarnText:  { color: '#ff8f00', fontSize: 11, fontWeight: '700', lineHeight: 16 },

  actionBar: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
    backgroundColor: '#0e0a07',
    borderTopWidth: 1,
    borderTopColor: '#1e1510',
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    gap: 3,
    borderWidth: 1,
  },
  rejectBtn:    { backgroundColor: '#1a0000', borderColor: '#3d0000' },
  queryBtn:     { backgroundColor: '#120d00', borderColor: '#261900' },
  queryBtnWarn: { backgroundColor: '#120800', borderColor: themeData.colors.stat_food },
  detailBtn:    { backgroundColor: '#0f0c0a', borderColor: '#211810' },
  acceptBtn:    { backgroundColor: '#001600', borderColor: '#002800' },
  btnDisabled:  { opacity: 0.35 },

  rejectMark:  { fontSize: 18, color: themeData.colors.reject_glow, fontWeight: '900' },
  acceptMark:  { fontSize: 18, color: themeData.colors.accept_glow, fontWeight: '900' },
  queryCharge: { fontSize: 16, fontWeight: '900' },
  detailMark:  { fontSize: 16, fontWeight: '900', fontStyle: 'italic' },
  actionLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
})
