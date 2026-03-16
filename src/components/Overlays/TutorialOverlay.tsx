import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native'
import themeData from '../../data/theme.json'
import uiData from '../../data/ui.json'

const C  = themeData.colors
const TY = themeData.typography as any
const SP = themeData.spacing
const R  = themeData.radius
const MONO     = Platform.select(themeData.ui.font_mono) as string
const DOTS     = themeData.ui.terminal_dots
const TUTORIAL = uiData.tutorial as {
  header: string
  tips: Array<{ icon: string; text: string }>
  continue_btn: string
}

interface Props {
  onClose: () => void
}

export const TutorialOverlay: React.FC<Props> = ({ onClose }) => (
  <View style={styles.overlay}>
    <View style={[styles.sheet, { paddingBottom: Platform.OS === 'android' ? 44 : 30 }]}>

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
        {TUTORIAL.tips.map((tip, i) => (
          <View key={i} style={styles.tipRow}>
            <View style={styles.iconBox}>
              <Text style={[styles.tipIcon, { fontFamily: MONO }]}>{tip.icon}</Text>
            </View>
            <Text style={styles.tipText}>{tip.text}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity onPress={onClose} style={styles.btn} activeOpacity={0.8}>
        <Text style={[styles.btnText, { fontFamily: MONO }]}>{TUTORIAL.continue_btn}</Text>
      </TouchableOpacity>

    </View>
  </View>
)

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.85)',
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
    borderBottomColor: C.card_bg,
  },
  dots:       { flexDirection: 'row', gap: 5 },
  dot:        { width: 8, height: 8, borderRadius: R.xs },
  headerText: {
    flex: 1,
    textAlign: 'center',
    color: C.text_secondary,
    fontSize: TY.size_xs,
    fontWeight: TY.weight_black,
    letterSpacing: 2,
  },
  list: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 16,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: R.md,
    backgroundColor: C.card_dark,
    borderWidth: 1,
    borderColor: C.divider,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipIcon: {
    color: C.text_muted,
    fontSize: TY.size_md,
    fontWeight: TY.weight_heavy,
  },
  tipText: {
    flex: 1,
    color: C.text_muted,
    fontSize: TY.size_sm,
    lineHeight: 18,
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
