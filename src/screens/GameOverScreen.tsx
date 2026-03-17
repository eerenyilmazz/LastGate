import React, { useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Platform, Dimensions } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, withDelay, withRepeat, withSequence, Easing,
} from 'react-native-reanimated'
import { useGameStore } from '../store/useGameStore'
import { useProgressStore } from '../store/useProgressStore'
import { GameOverReason } from '../types/game.types'
import ui from '../data/ui.json'
import themeData from '../data/theme.json'
const STRINGS = (ui as any).strings as Record<string, string>
const { height } = Dimensions.get('window')

const C  = themeData.colors
const TY = themeData.typography as any
const SP = themeData.spacing
const R  = themeData.radius
const MONO    = Platform.select(themeData.ui.font_mono) as string
const ENDINGS   = ui.game_over_endings as Record<GameOverReason, { title: string; desc: string; color: string; icon: string; tag: string }>
const RS_LABELS = ui.run_stats_labels as { header: string; accepted: string; rejected: string; queries: string; days: string }

interface Props {
  onRestart?: () => void
  onMainMenu?: () => void
}

export const GameOverScreen: React.FC<Props> = ({ onRestart, onMainMenu }) => {
  const game     = useGameStore()
  const progress = useProgressStore()

  const reason = game.gameOverReason ?? 'extinction'
  const ending = ENDINGS[reason]

  const vignetteOp = useSharedValue(0)
  const contentOp  = useSharedValue(0)
  const contentY   = useSharedValue(28)
  const iconScale  = useSharedValue(0.5)
  const titleOp    = useSharedValue(0)
  const scanY      = useSharedValue(0)

  useEffect(() => {
    const isVictory = reason === 'victory'
    vignetteOp.value = withRepeat(withSequence(
      withTiming(1,   { duration: 1800, easing: Easing.inOut(Easing.ease) }),
      withTiming(0.3, { duration: 2600, easing: Easing.inOut(Easing.ease) }),
    ), -1, true)

    contentOp.value = withDelay(200, withTiming(1, { duration: 700 }))
    contentY.value  = withDelay(200, withTiming(0, { duration: 600, easing: Easing.out(Easing.back(1.15)) }))
    iconScale.value = withDelay(400, withTiming(1, { duration: 800, easing: Easing.out(Easing.back(1.1)) }))

    if (isVictory) {
      titleOp.value = withDelay(700, withTiming(1, { duration: 600 }))
    } else {
      titleOp.value = withDelay(700, withRepeat(withSequence(
        withTiming(1,    { duration: 55  }),
        withTiming(0.5,  { duration: 90  }),
        withTiming(1,    { duration: 55  }),
        withTiming(0.9,  { duration: 3200 }),
      ), -1, true))
    }

    scanY.value = withRepeat(
      withTiming(height + 10, { duration: themeData.animation.gameover_scanline_ms, easing: Easing.linear }),
      -1, false,
    )
  }, [])

  const vignetteStyle = useAnimatedStyle(() => ({ opacity: vignetteOp.value }))
  const contentStyle  = useAnimatedStyle(() => ({
    opacity: contentOp.value,
    transform: [{ translateY: contentY.value }],
  }))
  const iconStyle  = useAnimatedStyle(() => ({ transform: [{ scale: iconScale.value }] }))
  const titleStyle = useAnimatedStyle(() => ({ opacity: titleOp.value }))
  const scanStyle  = useAnimatedStyle(() => ({ transform: [{ translateY: scanY.value }] }))

  const vignetteColor = reason === 'victory'
    ? C.victory_vignette : C.defeat_vignette

  return (
    <SafeAreaView style={styles.root}>

      <Animated.View style={[styles.scanline, scanStyle]} pointerEvents="none" />

      <Animated.View
        style={[styles.vignette, { backgroundColor: vignetteColor }, vignetteStyle]}
        pointerEvents="none"
      />

      <View style={[styles.accentLine, { backgroundColor: ending.color }]} />

      <Animated.View style={[styles.content, contentStyle]}>

        <Text style={[styles.dayTag, { fontFamily: MONO }]}>
          {ending.tag}  ·  {game.day}{STRINGS.gameover_day_suffix}
        </Text>

        <Animated.Text style={[styles.icon, iconStyle]}>{ending.icon}</Animated.Text>

        <Animated.Text style={[styles.title, { color: ending.color, fontFamily: MONO }, titleStyle]}>
          {ending.title}
        </Animated.Text>

        <View style={[styles.divider, { backgroundColor: ending.color + '30' }]} />

        <Text style={[styles.desc, { fontFamily: MONO }]}>{ending.desc}</Text>

        <View style={[styles.statsBox, { borderColor: ending.color + '22' }]}>
          <Text style={[styles.statsHeader, { fontFamily: MONO, color: ending.color + 'aa' }]}>
            {RS_LABELS.header}
          </Text>
          <View style={styles.statsGrid}>
            {[
              { label: RS_LABELS.days,     value: game.day },
              { label: RS_LABELS.accepted, value: game.runStats.accepted },
              { label: RS_LABELS.rejected, value: game.runStats.rejected },
              { label: RS_LABELS.queries,  value: game.runStats.queries },
            ].map(row => (
              <View key={row.label} style={styles.statRow}>
                <Text style={[styles.statLabel, { fontFamily: MONO }]}>{row.label}</Text>
                <Text style={[styles.statValue, { color: ending.color, fontFamily: MONO }]}>{row.value}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.spBox, { borderColor: ending.color + '35' }]}>
          <Text style={[styles.spLabel, { fontFamily: MONO }]}>{ui.labels.earned_sp}</Text>
          <Text style={[styles.spNum, { color: ending.color }]}>★  {progress.sp}</Text>
        </View>

        <TouchableOpacity
          onPress={onRestart}
          style={[styles.btn, { borderColor: ending.color + '55', backgroundColor: ending.color + '15' }]}
          activeOpacity={0.75}
        >
          <Text style={[styles.btnText, { color: ending.color, fontFamily: MONO }]}>
            {STRINGS.gameover_restart}
          </Text>
        </TouchableOpacity>

        {onMainMenu && (
          <TouchableOpacity onPress={onMainMenu} style={styles.btnGhost} activeOpacity={0.7}>
            <Text style={[styles.btnGhostText, { fontFamily: MONO }]}>{STRINGS.gameover_menu}</Text>
          </TouchableOpacity>
        )}

      </Animated.View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg_deeper,
    justifyContent: 'center',
  },

  scanline: {
    position: 'absolute', left: 0, right: 0, top: -4,
    height: 2, backgroundColor: C.surface_faint, zIndex: 20,
  },

  vignette: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 1,
  },

  accentLine: {
    position: 'absolute', top: 0, left: 0, right: 0,
    height: 2, zIndex: 10,
  },

  content: {
    zIndex: 5,
    paddingHorizontal: 32,
    alignItems: 'center',
  },

  dayTag: {
    color: C.text_muted,
    fontSize: TY.size_caption,
    letterSpacing: 3,
    marginBottom: 22,
  },

  icon: {
    fontSize: TY.size_hero,
    marginBottom: 18,
  },

  title: {
    fontSize: TY.size_h6_alt,
    fontWeight: TY.weight_black,
    letterSpacing: 2.5,
    textAlign: 'center',
    marginBottom: 16,
  },

  divider: {
    width: '55%',
    height: 1,
    marginBottom: 16,
  },

  desc: {
    color: C.text_muted,
    fontSize: TY.size_note,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 26,
    letterSpacing: 0.4,
  },

  statsBox: {
    width: '100%',
    borderWidth: 1,
    borderRadius: R.md,
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginBottom: 14,
    backgroundColor: C.bg_deeper,
    gap: 10,
  },
  statsHeader: {
    fontSize: TY.size_2xs,
    fontWeight: TY.weight_heavy,
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 4,
  },
  statsGrid: { gap: 8 },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: { color: C.text_muted, fontSize: TY.size_xs, letterSpacing: 0.5 },
  statValue: { fontSize: TY.size_md, fontWeight: TY.weight_heavy },

  spBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    borderWidth: 1,
    borderRadius: R.md,
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginBottom: 22,
    backgroundColor: C.bg_deeper,
  },
  spLabel: { color: C.text_muted, fontSize: TY.size_caption, letterSpacing: 2 },
  spNum:   { fontSize: TY.size_h5, fontWeight: TY.weight_black },

  btn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: R.md,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 8,
  },
  btnText: {
    fontSize: TY.size_sm,
    fontWeight: TY.weight_black,
    letterSpacing: 2,
  },

  btnGhost: { paddingVertical: 14, alignItems: 'center' },
  btnGhostText: { color: C.text_muted, fontSize: TY.size_note, letterSpacing: 1.5 },
})
