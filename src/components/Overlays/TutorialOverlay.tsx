import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import themeData from '../../data/theme.json'
import uiData from '../../data/ui.json'

const C  = themeData.colors
const TY = themeData.typography as any
const R  = themeData.radius
const MONO     = Platform.select(themeData.ui.font_mono) as string
const DOTS     = themeData.ui.terminal_dots
const TUTORIAL = uiData.tutorial as {
  header: string
  tips: Array<{ icon: string; color: string; title: string; desc: string }>
  continue_btn: string
}

type ColorKey = 'accept' | 'reject' | 'query' | 'neutral' | 'danger'
const TIP_COLORS: Record<ColorKey, string> = {
  accept:  C.accept,
  reject:  C.reject,
  query:   C.query,
  neutral: C.text_secondary,
  danger:  C.tutorial_danger,
}

interface Props {
  onClose: () => void
}

export const TutorialOverlay: React.FC<Props> = ({ onClose }) => {
  const insets = useSafeAreaInsets()
  return (
  <View style={styles.overlay}>
    <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>

      <View style={styles.termHeader}>
        <View style={styles.dots}>
          <View style={[styles.dot, { backgroundColor: DOTS[0] }]} />
          <View style={[styles.dot, { backgroundColor: DOTS[1] }]} />
          <View style={[styles.dot, { backgroundColor: DOTS[2] }]} />
        </View>
        <Text style={[styles.headerText, { fontFamily: MONO }]}>{TUTORIAL.header}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.list}>
        {TUTORIAL.tips.map((tip, i) => {
          const accent = TIP_COLORS[tip.color as ColorKey] ?? C.text_secondary
          return (
            <View key={i} style={styles.tipRow}>
              <View style={[styles.iconBox, {
                backgroundColor: accent + '18',
                borderColor: accent + '55',
              }]}>
                <Text style={[styles.tipIcon, { color: accent, fontFamily: MONO }]}>{tip.icon}</Text>
              </View>
              <View style={styles.tipBody}>
                <Text style={[styles.tipTitle, { color: accent, fontFamily: MONO }]}>{tip.title}</Text>
                <Text style={styles.tipDesc}>{tip.desc}</Text>
              </View>
            </View>
          )
        })}
      </View>

      <TouchableOpacity onPress={onClose} style={styles.btn} activeOpacity={0.8}>
        <Text style={[styles.btnText, { fontFamily: MONO }]}>{TUTORIAL.continue_btn}</Text>
      </TouchableOpacity>

    </View>
  </View>
  )
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    backgroundColor: C.overlay_backdrop_dark,
  },
  sheet: {
    backgroundColor: C.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderColor: C.card_bg,
  },
  termHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: C.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomWidth: 1,
    borderBottomColor: C.divider,
  },
  dots: { flexDirection: 'row', gap: 5 },
  dot:  { width: 8, height: 8, borderRadius: R.xs },
  headerText: {
    flex: 1,
    textAlign: 'center',
    color: C.text_secondary,
    fontSize: TY.size_xs,
    fontWeight: TY.weight_black,
    letterSpacing: 2,
  },
  list: {
    paddingHorizontal: 18,
    paddingVertical: 18,
    gap: 14,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: R.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  tipIcon: {
    fontSize: TY.size_h5,
    fontWeight: TY.weight_black,
  },
  tipBody: {
    flex: 1,
    gap: 2,
  },
  tipTitle: {
    fontSize: TY.size_note,
    fontWeight: TY.weight_black,
    letterSpacing: 1.5,
  },
  tipDesc: {
    color: C.text_secondary,
    fontSize: TY.size_xs,
    lineHeight: 16,
  },
  btn: {
    marginHorizontal: 16,
    marginTop: 4,
    paddingVertical: 14,
    borderRadius: R.md,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.divider,
    alignItems: 'center',
  },
  btnText: {
    color: C.query,
    fontSize: TY.size_note,
    fontWeight: TY.weight_black,
    letterSpacing: 2,
  },
})
