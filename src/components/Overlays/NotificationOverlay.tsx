import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Platform, Modal } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useGameStore } from '../../store/useGameStore'
import themeData from '../../data/theme.json'
import uiData from '../../data/ui.json'

const C  = themeData.colors
const TY = themeData.typography as any
const SP = themeData.spacing
const R  = themeData.radius
const MONO   = Platform.select(themeData.ui.font_mono) as string
const DOTS   = themeData.ui.terminal_dots
const REPORT = uiData.night_report as { header_prefix: string; header_suffix: string; no_events: string; continue_btn: string }

interface Props {
  onContinue: () => void
}

export const NotificationOverlay: React.FC<Props> = ({ onContinue }) => {
  const insets = useSafeAreaInsets()
  const game = useGameStore()
  const day  = game.day

  const notes = game.notifications.length > 0
    ? game.notifications
    : [REPORT.no_events]

  return (
    <Modal
      visible
      transparent
      animationType="slide"
      onRequestClose={onContinue}
      statusBarTranslucent
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onContinue}
      >
        <TouchableOpacity
          style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}
          activeOpacity={1}
          onPress={onContinue}
        >

          <View style={styles.termHeader}>
            <View style={styles.dots}>
              <View style={[styles.dot, { backgroundColor: DOTS[0] }]} />
              <View style={[styles.dot, { backgroundColor: DOTS[1] }]} />
              <View style={[styles.dot, { backgroundColor: DOTS[2] }]} />
            </View>
            <Text style={[styles.headerText, { fontFamily: MONO }]}>
              {REPORT.header_prefix}{day}{REPORT.header_suffix}
            </Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.list}>
            {notes.map((text, i) => (
              <View key={i} style={styles.noteRow}>
                <Text style={[styles.bullet, { fontFamily: MONO }]}>›</Text>
                <Text style={[styles.noteText, { fontFamily: MONO }]}>{text}</Text>
              </View>
            ))}
          </View>

          <Text style={[styles.tapHint, { fontFamily: MONO }]}>{uiData.labels.continue_hint}</Text>

        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    backgroundColor: C.overlay_backdrop_deep,
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
    color: C.text_muted,
    fontSize: TY.size_xs,
    fontWeight: TY.weight_heavy,
    letterSpacing: 2.5,
  },
  list:   { paddingHorizontal: 20, paddingVertical: 18, gap: 14 },
  noteRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  bullet: {
    color: C.text_muted,
    fontSize: TY.size_md,
    lineHeight: 19,
  },
  noteText: {
    flex: 1,
    color: C.text_muted,
    fontSize: TY.size_sm,
    lineHeight: 19,
  },
  tapHint: {
    color: C.button_border,
    fontSize: TY.size_caption,
    letterSpacing: 2,
    textAlign: 'center',
    paddingBottom: 8,
    paddingTop: 4,
  },
})
