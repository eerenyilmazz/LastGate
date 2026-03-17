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
  const [typedText,        setTypedText]        = useState('')
  const [isTyping,         setIsTyping]         = useState(false)
  const [cursorOn,         setCursorOn]         = useState(true)

  const canQuery  = game.queryChargesLeft > 0
  const isCompact = sh < 700

  // statBar(72) + dialogueZone(80) + infoBar(52) + actionRow(72) + gaps(20) ≈ 296
  const naturalCardH = Math.round(sw * 0.84 / CARD_ASPECT)
  const maxCardH     = Math.max(180, innerH - (isCompact ? 256 : 296))
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

  // Typewriter: type out NPC dialogue when NPC changes
  useEffect(() => {
    if (!npc) { setTypedText(''); return }
    const full = npc.dialogue
    setTypedText('')
    setIsTyping(true)
    let i = 0
    const iv = setInterval(() => {
      i++
      setTypedText(full.slice(0, i))
      if (i >= full.length) { clearInterval(iv); setIsTyping(false) }
    }, 26)
    return () => clearInterval(iv)
  }, [npc?.npc_id])

  // Cursor blink (only when not typing)
  useEffect(() => {
    if (isTyping) { setCursorOn(true); return }
    const iv = setInterval(() => setCursorOn(v => !v), 530)
    return () => clearInterval(iv)
  }, [isTyping])

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

  // Dialogue zone: query warning / query result override; otherwise typewriter
  const overrideContent = isDecision && queryWarnPending
    ? { text: `⚠  ${L.query_food_warn_prefix}${config.query_food_cost}${L.query_food_warn_suffix}`, color: C.query }
    : isDecision && queryResult
    ? { text: `▶  ${queryResult}`, color: C.accept_glow }
    : null

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.background }]} onLayout={onSafeLayout}>
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

      {/* ── DIALOGUE ZONE ──────────────────────────────────── */}
      <View style={styles.dialogueZone}>
        {overrideContent ? (
          <Text style={[styles.dialogueText, { color: overrideContent.color, fontFamily: MONO }]} numberOfLines={3}>
            {overrideContent.text}
          </Text>
        ) : npc ? (
          <Text style={[styles.dialogueText, styles.dialogueItalic, { color: C.text_secondary, fontFamily: MONO }]} numberOfLines={3}>
            {`"`}{typedText}
            {<Text style={{ opacity: cursorOn ? 1 : 0 }}>{'▊'}</Text>}
            {!isTyping && `"`}
          </Text>
        ) : null}
      </View>

      {/* ── CARD ZONE ──────────────────────────────────────── */}
      <View style={[styles.cardZone, { height: cardSlotH }]}>
        {npc && (
          <SwipeHandler
            key={npc.npc_id}
            dragX={dragX}
            onSwipeRight={doAccept}
            onSwipeLeft={doReject}
            onSwipeUp={onQuery}
            disabled={!isDecision}
          >
            <NPCCard npc={npc} availableHeight={cardSlotH} hideDialogue />
          </SwipeHandler>
        )}
      </View>

      {/* ── INFO BAR ───────────────────────────────────────── */}
      <View style={styles.infoBar}>
        {/* day counter */}
        <View style={styles.dayBlock}>
          <Text style={[styles.dayLabel, { fontFamily: MONO }]}>GÜN</Text>
          <Text style={[styles.dayVal, { fontFamily: MONO }]}>
            {String(game.day).padStart(2, '0')}
            <Text style={[styles.dayMax, { fontFamily: MONO }]}>/{config.win_condition_day}</Text>
          </Text>
        </View>

        {/* mission progress bar */}
        <View style={styles.progressWrap}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${dayPct}%` as any }]} />
          </View>
        </View>

        {/* utility buttons */}
        <View style={styles.utilGroup}>
          <TouchableOpacity
            onPress={onQuery}
            disabled={!canQuery || !isDecision}
            style={[styles.utilBtn, queryWarnPending && styles.utilBtnWarn, !canQuery && styles.utilBtnOff]}
            activeOpacity={0.75}
          >
            <Text style={[styles.utilBtnText, {
              color: queryWarnPending ? C.query : canQuery ? C.query : C.text_muted,
              fontFamily: MONO,
            }]}>
              {queryWarnPending ? '⚠' : '🔬'}×{game.queryChargesLeft}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setDetailsVisible(true)}
            disabled={!isDecision}
            style={styles.utilBtn}
            activeOpacity={0.75}
          >
            <Text style={[styles.utilBtnText, { color: C.text_muted, fontFamily: MONO }]}>📋</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── ACTION BUTTONS ─────────────────────────────────── */}
      <View style={[styles.actionRow, {
        paddingBottom: Platform.OS === 'android' ? 16 : 10,
        opacity: isDecision ? 1 : 0,
      }]}>
        <TouchableOpacity
          onPress={doReject} disabled={!isDecision}
          style={[styles.actionBtn, styles.rejectBtn]} activeOpacity={0.72}
        >
          <Text style={[styles.actionText, { color: C.reject_glow, fontFamily: MONO }]}>← {L.btn_reject}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={doAccept} disabled={!isDecision}
          style={[styles.actionBtn, styles.acceptBtn]} activeOpacity={0.72}
        >
          <Text style={[styles.actionText, { color: C.accept_glow, fontFamily: MONO }]}>{L.btn_accept} →</Text>
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

  // Dialogue zone — fixed height, card position never jumps
  dialogueZone: {
    height: 80,
    paddingHorizontal: SP.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialogueText: {
    fontSize: TY.size_sm,
    lineHeight: 20,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  dialogueItalic: { fontStyle: 'italic' },

  // Card
  cardZone: {
    justifyContent: 'center',
    alignItems: 'center',
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
  progressWrap: { flex: 1 },
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
  utilGroup: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  utilBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: R.sm,
    borderWidth: 1,
    backgroundColor: C.card_dark,
    borderColor: C.divider,
  },
  utilBtnWarn: { borderColor: C.query, backgroundColor: C.query + '14' },
  utilBtnOff:  { opacity: 0.3 },
  utilBtnText: { fontSize: TY.size_sm, fontWeight: TY.weight_heavy, letterSpacing: 0.3 },

  // Action buttons
  actionRow: {
    flexDirection: 'row',
    paddingHorizontal: SP.sm,
    paddingTop: 6,
    gap: SP.xs,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: R.md,
    borderWidth: 2,
  },
  rejectBtn: {
    borderColor: C.danger,
    backgroundColor: C.danger_dark,
    shadowColor: C.danger,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 8,
    elevation: 7,
  },
  acceptBtn: {
    borderColor: C.accept,
    backgroundColor: C.accept + '0f',
    shadowColor: C.accept_glow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 7,
  },
  actionText: {
    fontSize: TY.size_h6,
    fontWeight: TY.weight_black,
    letterSpacing: 2,
  },
})
