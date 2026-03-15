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

const MONO    = Platform.select(themeData.ui.font_mono) as string
const { height } = Dimensions.get('window')
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

    // Başlık flicker — zafer için düz, ölüm için glitch
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
      withTiming(height + 10, { duration: 4000, easing: Easing.linear }),
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
    ? 'rgba(0,60,0,0.10)' : 'rgba(80,0,0,0.12)'

  return (
    <SafeAreaView style={styles.root}>

      {/* CRT scan */}
      <Animated.View style={[styles.scanline, scanStyle]} pointerEvents="none" />

      {/* Vignette */}
      <Animated.View
        style={[styles.vignette, { backgroundColor: vignetteColor }, vignetteStyle]}
        pointerEvents="none"
      />

      {/* Üst renk çizgisi */}
      <View style={[styles.accentLine, { backgroundColor: ending.color }]} />

      <Animated.View style={[styles.content, contentStyle]}>

        {/* Tag + gün */}
        <Text style={[styles.dayTag, { fontFamily: MONO }]}>
          {ending.tag}  ·  {game.day}{ui.labels.day_num_suffix ?? '. GÜN'}
        </Text>

        {/* İkon */}
        <Animated.Text style={[styles.icon, iconStyle]}>{ending.icon}</Animated.Text>

        {/* Başlık */}
        <Animated.Text style={[styles.title, { color: ending.color, fontFamily: MONO }, titleStyle]}>
          {ending.title}
        </Animated.Text>

        {/* Ayraç */}
        <View style={[styles.divider, { backgroundColor: ending.color + '30' }]} />

        {/* Açıklama */}
        <Text style={[styles.desc, { fontFamily: MONO }]}>{ending.desc}</Text>

        {/* Koşu istatistikleri */}
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

        {/* SP */}
        <View style={[styles.spBox, { borderColor: ending.color + '35' }]}>
          <Text style={[styles.spLabel, { fontFamily: MONO }]}>{ui.labels.earned_sp ?? 'KAZANILAN SP'}</Text>
          <Text style={[styles.spNum, { color: ending.color }]}>★  {progress.sp}</Text>
        </View>

        {/* Yeniden Başla */}
        <TouchableOpacity
          onPress={onRestart}
          style={[styles.btn, { borderColor: ending.color + '55', backgroundColor: ending.color + '15' }]}
          activeOpacity={0.75}
        >
          <Text style={[styles.btnText, { color: ending.color, fontFamily: MONO }]}>
            {ui.labels.btn_restart ?? '[ YENİDEN BAŞLA ]'}
          </Text>
        </TouchableOpacity>

        {/* Ana Menü */}
        {onMainMenu && (
          <TouchableOpacity onPress={onMainMenu} style={styles.btnGhost} activeOpacity={0.7}>
            <Text style={[styles.btnGhostText, { fontFamily: MONO }]}>{ui.labels.btn_main_menu ?? '↩  ANA MENÜ'}</Text>
          </TouchableOpacity>
        )}

      </Animated.View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#040404',
    justifyContent: 'center',
  },

  scanline: {
    position: 'absolute', left: 0, right: 0, top: -4,
    height: 2, backgroundColor: 'rgba(255,255,255,0.03)', zIndex: 20,
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
    color: '#2e2e2e',
    fontSize: 9,
    letterSpacing: 3,
    marginBottom: 22,
  },

  icon: {
    fontSize: 58,
    marginBottom: 18,
  },

  title: {
    fontSize: 17,
    fontWeight: '900',
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
    color: '#333',
    fontSize: 11,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 26,
    letterSpacing: 0.4,
  },

  statsBox: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginBottom: 14,
    backgroundColor: '#080808',
    gap: 10,
  },
  statsHeader: {
    fontSize: 8,
    fontWeight: '800',
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
  statLabel: { color: '#2a2a2a', fontSize: 10, letterSpacing: 0.5 },
  statValue: { fontSize: 14, fontWeight: '800' },

  spBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginBottom: 22,
    backgroundColor: '#080808',
  },
  spLabel: { color: '#2a2a2a', fontSize: 9, letterSpacing: 2 },
  spNum:   { fontSize: 20, fontWeight: '900' },

  btn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 8,
  },
  btnText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
  },

  btnGhost: { paddingVertical: 14, alignItems: 'center' },
  btnGhostText: { color: '#222', fontSize: 11, letterSpacing: 1.5 },
})
