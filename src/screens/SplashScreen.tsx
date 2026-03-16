import React, { useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Platform } from 'react-native'
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, withDelay, withRepeat, withSequence, Easing,
} from 'react-native-reanimated'

import ui from '../data/ui.json'
import themeData from '../data/theme.json'

interface Props { onDone: () => void }

const { height } = Dimensions.get('window')
const C = themeData.colors
const MONO         = Platform.select(themeData.ui.font_mono) as string
const STATUS_ITEMS = ui.splash_status_items

export const SplashScreen: React.FC<Props> = ({ onDone }) => {
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
  const alertOp   = useSharedValue(0)
  const bloodOp   = useSharedValue(0)

  useEffect(() => {
    alertOp.value = withDelay(100,
      withRepeat(withSequence(
        withTiming(1,    { duration: 80  }),
        withTiming(0.55, { duration: 140 }),
        withTiming(1,    { duration: 80  }),
        withTiming(0.85, { duration: 450 }),
      ), -1, true),
    )
    logoOp.value    = withDelay(500,  withTiming(1, { duration: 900 }))
    logoScale.value = withDelay(500,  withTiming(1, { duration: 900, easing: Easing.out(Easing.back(1.05)) }))
    subOp.value     = withDelay(1100, withTiming(1, { duration: 500 }))
    termOp.value    = withDelay(1300, withTiming(1, { duration: 300 }))
    s0.value        = withDelay(1450, withTiming(1, { duration: 200 }))
    s1.value        = withDelay(1750, withTiming(1, { duration: 200 }))
    s2.value        = withDelay(2050, withTiming(1, { duration: 200 }))
    s3.value        = withDelay(2350, withTiming(1, { duration: 200 }))
    bottomOp.value  = withDelay(2650, withTiming(1, { duration: 500 }))
    hintOp.value    = withDelay(3200,
      withRepeat(withSequence(
        withTiming(1,    { duration: 700 }),
        withTiming(0.12, { duration: 700 }),
      ), -1, true),
    )
    scanY.value = withRepeat(
      withTiming(height + 10, { duration: 4000, easing: Easing.linear }),
      -1, false,
    )
    bloodOp.value = withDelay(400,
      withRepeat(withSequence(
        withTiming(1,   { duration: 2400, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.2, { duration: 3600, easing: Easing.inOut(Easing.ease) }),
      ), -1, true),
    )
  }, [])

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
  const alertStyle  = useAnimatedStyle(() => ({ opacity: alertOp.value }))
  const bloodStyle  = useAnimatedStyle(() => ({ opacity: bloodOp.value }))

  const statusStyles = [s0Style, s1Style, s2Style, s3Style]

  return (
    <TouchableOpacity activeOpacity={1} onPress={onDone} style={styles.root}>

      <Animated.View style={[styles.scanline, scanStyle]} pointerEvents="none" />

      <Animated.View style={[styles.bloodVignette, bloodStyle]} pointerEvents="none" />

      <Animated.View style={[styles.alertStripe, alertStyle]} pointerEvents="none">
        <Text style={[styles.alertText, { fontFamily: MONO }]} numberOfLines={1}>
          {'>> ACİL DURUM · BÖLGE 7 · ENFEKSİYON · HAYATTA KAL · SON KAPI AKTİF >>'}
        </Text>
      </Animated.View>

      <View style={styles.center}>

        <Animated.View style={[styles.logoBlock, logoStyle]}>
          <Text style={styles.emblem}>☣</Text>
          <Text style={styles.title}>LAST GATE</Text>
        </Animated.View>

        <Animated.Text style={[styles.subtitle, subStyle, { fontFamily: MONO }]}>
          — SON KAPI —
        </Animated.Text>

        <Animated.View style={[styles.terminal, termStyle]}>
          <View style={styles.termHeader}>
            <View style={styles.termDot} />
            <View style={[styles.termDot, { backgroundColor: C.text_muted }]} />
            <View style={[styles.termDot, { backgroundColor: C.border_pos }]} />
            <Text style={[styles.termTitle, { fontFamily: MONO }]}>DURUM RAPORU / ZONE-7</Text>
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
        <Text style={[styles.tagline, { fontFamily: MONO }]}>{'>> 100 GÜN HAYATTA KAL <<'}</Text>
      </Animated.View>

      <Animated.View style={[styles.hintWrap, hintStyle]}>
        <Text style={[styles.hintBracket, { fontFamily: MONO }]}>[</Text>
        <Text style={[styles.hintText, { fontFamily: MONO }]}>  KAPIYA DOKUN  </Text>
        <Text style={[styles.hintBracket, { fontFamily: MONO }]}>]</Text>
      </Animated.View>

      <Text style={[styles.version, { fontFamily: MONO }]}>BETA v0.1 · SEKTOR 7</Text>

    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg_deeper,
    alignItems: 'center',
  },

  scanline: {
    position: 'absolute', left: 0, right: 0, top: -4,
    height: 2, backgroundColor: 'rgba(255,255,255,0.04)', zIndex: 20,
  },

  bloodVignette: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(110, 0, 0, 0.07)',
    zIndex: 1,
  },
  alertStripe: {
    backgroundColor: C.bg_deeper,
    width: '100%',
    paddingVertical: 7,
    paddingHorizontal: 12,
    marginTop: Platform.OS === 'android' ? 40 : 52,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: C.bg_deeper,
    overflow: 'hidden',
  },
  alertText: { color: C.text_muted, fontSize: 9, fontWeight: '800', letterSpacing: 2 },

  center: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingHorizontal: 20,
  },

  logoBlock: { alignItems: 'center', gap: 8 },
  emblem: { fontSize: 42, color: C.text_muted },
  title: {
    fontSize: 44,
    fontWeight: '900',
    color: C.text_bright,
    letterSpacing: 9,
  },
  subtitle: { fontSize: 10, fontWeight: '700', color: C.text_muted, letterSpacing: 8 },

  terminal: {
    width: '100%',
    backgroundColor: C.bg_deeper,
    borderWidth: 1,
    borderColor: C.bg_deeper,
    borderRadius: 6,
    overflow: 'hidden',
  },
  termHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: C.bg_deeper,
  },
  termDot:    { width: 7, height: 7, borderRadius: 4, backgroundColor: C.text_muted },
  termTitle:  { color: C.text_muted, fontSize: 9, letterSpacing: 2, fontWeight: '700', marginLeft: 6, flex: 1, textAlign: 'right' },
  termDivider:{ height: 1, backgroundColor: C.bg_deeper },
  termBody:   { padding: 12, gap: 10 },
  statusRow:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusTag:  { fontSize: 9, width: 26, fontWeight: '800' },
  statusLabel:{ color: C.text_muted, fontSize: 9, fontWeight: '700', letterSpacing: 0.5, flex: 1 },
  dotsRow:    { flexDirection: 'row', gap: 2, alignItems: 'center', marginHorizontal: 4 },
  dot:        { width: 2, height: 2, borderRadius: 1, backgroundColor: C.bg_deeper },
  statusValue:{ fontSize: 9, fontWeight: '800', letterSpacing: 1.5 },

  taglineWrap: { alignItems: 'center', marginBottom: 14 },
  tagline: { color: C.text_muted, fontSize: 10, letterSpacing: 2, fontWeight: '700' },

  hintWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  hintBracket: { color: C.text_muted, fontSize: 13, fontWeight: '900' },
  hintText:    { color: C.text_muted, fontSize: 10, fontWeight: '800', letterSpacing: 3 },

  version: {
    fontSize: 8,
    color: C.bg_deeper,
    letterSpacing: 2,
    marginBottom: Platform.OS === 'android' ? 18 : 14,
  },
})
