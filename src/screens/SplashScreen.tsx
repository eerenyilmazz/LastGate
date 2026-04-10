import React, { useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Platform, useWindowDimensions, Image } from 'react-native'
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, withDelay, withRepeat, withSequence, Easing, runOnJS,
} from 'react-native-reanimated'

import ui from '../data/ui.json'
import config from '../data/config.json'
import themeData from '../data/theme.json'
import { useSettingsStore } from '../store/useSettingsStore'

const uiStrings = (ui as any).strings as Record<string, string>

interface Props { onDone: () => void }

const C  = themeData.colors
const TY = themeData.typography as any
const SP = themeData.spacing
const R  = themeData.radius
const A  = themeData.animation
const MONO         = Platform.select(themeData.ui.font_mono) as string
const STATUS_ITEMS = ui.splash_status_items

export const SplashScreen: React.FC<Props> = ({ onDone }) => {
  const settings = useSettingsStore()
  const winDay   = (config as any).win_condition_days[settings.difficulty] ?? 100
  const { width, height } = useWindowDimensions()
  const emblemSize = Math.round(width * 0.88)

  const exitOp    = useSharedValue(0)
  const logoOp    = useSharedValue(0)
  const logoScale = useSharedValue(0.88)
  const subOp     = useSharedValue(0)
  const termOp    = useSharedValue(0)
  const s0        = useSharedValue(0)
  const s1        = useSharedValue(0)
  const s2        = useSharedValue(0)
  const s3        = useSharedValue(0)
  const bottomOp  = useSharedValue(0)
  const hintOp    = useSharedValue(0)
  const scanY     = useSharedValue(0)
  const shakeX    = useSharedValue(0)
  const shakeY    = useSharedValue(0)
  const progressW = useSharedValue(0)

  useEffect(() => {
    logoOp.value    = withDelay(A.splash_logo_delay_ms,   withTiming(1, { duration: A.splash_logo_ms }))
    logoScale.value = withDelay(A.splash_logo_delay_ms,   withTiming(1, { duration: A.splash_logo_ms, easing: Easing.out(Easing.back(1.05)) }))
    subOp.value     = withDelay(A.splash_sub_delay_ms,    withTiming(1, { duration: A.splash_bottom_ms }))
    termOp.value    = withDelay(A.splash_term_delay_ms,   withTiming(1, { duration: A.swipe_duration_ms }))
    s0.value        = withDelay(A.splash_dot_delay_base_ms + A.splash_dot_step_ms * 0, withTiming(1, { duration: A.splash_dot_ms }))
    s1.value        = withDelay(A.splash_dot_delay_base_ms + A.splash_dot_step_ms * 1, withTiming(1, { duration: A.splash_dot_ms }))
    s2.value        = withDelay(A.splash_dot_delay_base_ms + A.splash_dot_step_ms * 2, withTiming(1, { duration: A.splash_dot_ms }))
    s3.value        = withDelay(A.splash_dot_delay_base_ms + A.splash_dot_step_ms * 3, withTiming(1, { duration: A.splash_dot_ms }))
    bottomOp.value  = withDelay(A.splash_bottom_delay_ms, withTiming(1, { duration: A.splash_bottom_ms }))
    hintOp.value    = withDelay(A.splash_hint_delay_ms,
      withRepeat(withSequence(
        withTiming(1,    { duration: A.splash_hint_blink_ms }),
        withTiming(0.12, { duration: A.splash_hint_blink_ms }),
      ), -1, true),
    )
    scanY.value = withRepeat(
      withTiming(height + 10, { duration: A.splash_scanline_ms, easing: Easing.linear }),
      -1, false,
    )
    shakeX.value = withRepeat(withSequence(
      withTiming( 1.5, { duration: 60,  easing: Easing.linear }),
      withTiming(-2,   { duration: 80,  easing: Easing.linear }),
      withTiming( 1,   { duration: 55,  easing: Easing.linear }),
      withTiming(-1.5, { duration: 70,  easing: Easing.linear }),
      withTiming( 0,   { duration: 50,  easing: Easing.linear }),
      withTiming( 0,   { duration: 900, easing: Easing.linear }),
    ), -1, false)
    shakeY.value = withRepeat(withSequence(
      withTiming( 1,   { duration: 70,  easing: Easing.linear }),
      withTiming(-1.5, { duration: 60,  easing: Easing.linear }),
      withTiming( 0.5, { duration: 80,  easing: Easing.linear }),
      withTiming(-1,   { duration: 55,  easing: Easing.linear }),
      withTiming( 0,   { duration: 50,  easing: Easing.linear }),
      withTiming( 0,   { duration: 900, easing: Easing.linear }),
    ), -1, false)
    progressW.value = withDelay(A.splash_logo_delay_ms, withTiming(1, { duration: A.splash_progress_ms, easing: Easing.out(Easing.quad) }))
  }, [])

  const exitStyle   = useAnimatedStyle(() => ({ opacity: exitOp.value }))
  const logoStyle   = useAnimatedStyle(() => ({ opacity: logoOp.value, transform: [{ scale: logoScale.value }] }))
  const subStyle    = useAnimatedStyle(() => ({ opacity: subOp.value }))
  const termStyle   = useAnimatedStyle(() => ({ opacity: termOp.value }))
  const s0Style     = useAnimatedStyle(() => ({ opacity: s0.value }))
  const s1Style     = useAnimatedStyle(() => ({ opacity: s1.value }))
  const s2Style     = useAnimatedStyle(() => ({ opacity: s2.value }))
  const s3Style     = useAnimatedStyle(() => ({ opacity: s3.value }))
  const bottomStyle = useAnimatedStyle(() => ({ opacity: bottomOp.value }))
  const hintStyle   = useAnimatedStyle(() => ({ opacity: hintOp.value }))
  const scanStyle   = useAnimatedStyle(() => ({ transform: [{ translateY: scanY.value }] }))
  const shakeStyle  = useAnimatedStyle(() => ({ transform: [{ translateX: shakeX.value }, { translateY: shakeY.value }] }))
  const progressBarStyle = useAnimatedStyle(() => ({ width: `${progressW.value * 100}%` as any }))

  const statusStyles = [s0Style, s1Style, s2Style, s3Style]

  const handleDone = () => {
    exitOp.value = withTiming(1, { duration: 280, easing: Easing.in(Easing.ease) }, (finished) => {
      if (finished) runOnJS(onDone)()
    })
  }

  return (
    <TouchableOpacity activeOpacity={1} onPress={handleDone} style={styles.root}>
      <Animated.View style={[StyleSheet.absoluteFillObject, { backgroundColor: C.bg_deeper }, exitStyle]} pointerEvents="none" />
      <Animated.View style={[styles.scanline, scanStyle]} pointerEvents="none" />

      <Animated.View style={[styles.shakeWrap, shakeStyle]}>

        <View style={styles.center}>
          <Animated.View style={[styles.logoBlock, logoStyle]}>
            <Image source={require('../../assets/android-icon-foreground.png')} style={[styles.emblem, { width: emblemSize, height: emblemSize }]} resizeMode="contain" />
            <Animated.Text style={[styles.subtitle, subStyle, { fontFamily: MONO }]}>
              {uiStrings.splash_subtitle}
            </Animated.Text>
          </Animated.View>

          <Animated.View style={[styles.terminal, termStyle]}>
            <View style={styles.termHeader}>
              <View style={styles.termDot} />
              <View style={[styles.termDot, { backgroundColor: C.text_muted }]} />
              <View style={[styles.termDot, { backgroundColor: C.border_pos }]} />
              <Text style={[styles.termTitle, { fontFamily: MONO }]}>{uiStrings.splash_terminal}</Text>
            </View>

            <View style={styles.termDivider} />

            <View style={styles.termBody}>
              {STATUS_ITEMS.map((item, i) => (
                <Animated.View key={i} style={[styles.statusRow, statusStyles[i]]}>
                  <Text style={[styles.statusTag, { color: item.color, fontFamily: MONO }]}>{item.tag}</Text>
                  <Text style={[styles.statusLabel, { fontFamily: MONO }]}>{item.label}</Text>
                  <View style={styles.dotsRow}>
                    {Array(10).fill(null).map((_, di) => <View key={di} style={styles.dot} />)}
                  </View>
                  <Text style={[styles.statusValue, { color: item.color, fontFamily: MONO }]}>{item.value}</Text>
                </Animated.View>
              ))}
            </View>
          </Animated.View>
        </View>

        <Animated.View style={[styles.taglineWrap, bottomStyle]} pointerEvents="none">
          <Text style={[styles.tagline, { fontFamily: MONO }]}>{uiStrings.splash_tagline.replace('{win_day}', String(winDay))}</Text>
        </Animated.View>

        <View style={styles.progressWrap}>
          <Text style={[styles.progressLabel, { fontFamily: MONO }]}>{uiStrings.splash_loading}</Text>
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, progressBarStyle]} />
          </View>
        </View>

        <Animated.View style={[styles.hintWrap, hintStyle]}>
          <Text style={[styles.hintBracket, { fontFamily: MONO }]}>[</Text>
          <Text style={[styles.hintText, { fontFamily: MONO }]}>{uiStrings.splash_hint}</Text>
          <Text style={[styles.hintBracket, { fontFamily: MONO }]}>]</Text>
        </Animated.View>

        <Text style={[styles.version, { fontFamily: MONO }]}>{uiStrings.splash_version}</Text>

      </Animated.View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg_deeper,
    alignItems: 'center',
  },
  shakeWrap: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
  },

  scanline: {
    position: 'absolute', left: 0, right: 0, top: -4,
    height: 2, backgroundColor: 'rgba(255,255,255,0.04)', zIndex: 20,
  },

  center: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 20,
  },

  logoBlock: { alignItems: 'center', gap: 0 },
  emblem: { width: 450, height: 450, marginBottom: -40 },
  subtitle: { fontSize: TY.size_xs, fontWeight: TY.weight_bold, color: C.text_muted, letterSpacing: 8 },

  terminal: {
    width: '100%',
    backgroundColor: C.bg_deeper,
    borderWidth: 1,
    borderColor: C.bg_deeper,
    borderRadius: R.sm,
    overflow: 'hidden',
  },
  termHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: C.bg_deeper,
  },
  termDot:    { width: 7, height: 7, borderRadius: R.xs, backgroundColor: C.text_muted },
  termTitle:  { color: C.text_muted, fontSize: TY.size_caption, letterSpacing: 2, fontWeight: TY.weight_bold, marginLeft: 6, flex: 1, textAlign: 'right' },
  termDivider:{ height: 1, backgroundColor: C.bg_deeper },
  termBody:   { padding: 12, gap: 10 },
  statusRow:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusTag:  { fontSize: TY.size_caption, width: 26, fontWeight: TY.weight_heavy },
  statusLabel:{ color: C.text_muted, fontSize: TY.size_caption, fontWeight: TY.weight_bold, letterSpacing: 0.5, flex: 1 },
  dotsRow:    { flexDirection: 'row', gap: 2, alignItems: 'center', marginHorizontal: 4 },
  dot:        { width: 2, height: 2, borderRadius: 1, backgroundColor: C.bg_deeper },
  statusValue:{ fontSize: TY.size_caption, fontWeight: TY.weight_heavy, letterSpacing: 1.5 },

  taglineWrap: { alignItems: 'center', marginBottom: 14 },
  tagline: { color: C.text_muted, fontSize: TY.size_xs, letterSpacing: 2, fontWeight: TY.weight_bold },

  progressWrap: {
    width: '88%',
    gap: 6,
    marginBottom: 16,
  },
  progressLabel: {
    color: C.text_muted,
    fontSize: TY.size_caption,
    letterSpacing: 3,
    fontWeight: TY.weight_heavy,
  },
  progressTrack: {
    height: 2,
    width: '100%',
    backgroundColor: C.card_dark,
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressFill: {
    height: 2,
    backgroundColor: C.text_muted,
    borderRadius: 1,
  },

  hintWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  hintBracket: { color: C.text_bright, fontSize: TY.size_body, fontWeight: TY.weight_black },
  hintText:    { color: C.text_bright, fontSize: TY.size_xs, fontWeight: TY.weight_heavy, letterSpacing: 3 },

  version: {
    fontSize: TY.size_2xs,
    color: C.bg_deeper,
    letterSpacing: 2,
    marginBottom: Platform.OS === 'android' ? 18 : 14,
  },
})
