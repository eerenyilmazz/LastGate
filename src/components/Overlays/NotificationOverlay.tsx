import React from 'react'
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Platform } from 'react-native'
import { useGameStore } from '../../store/useGameStore'
import themeData from '../../data/theme.json'
import uiData from '../../data/ui.json'

const MONO   = Platform.select(themeData.ui.font_mono) as string
const DOTS   = themeData.ui.terminal_dots
const REPORT = uiData.night_report as { header_prefix: string; header_suffix: string; no_events: string; continue_btn: string }

interface Props {
  onContinue: () => void
}

export const NotificationOverlay: React.FC<Props> = ({ onContinue }) => {
  const game = useGameStore()
  const day  = game.day

  const notes = game.notifications.length > 0
    ? game.notifications
    : [REPORT.no_events]

  return (
    <View style={styles.overlay}>
      <View style={[styles.sheet, { paddingBottom: Platform.OS === 'android' ? 44 : 30 }]}>

        {/* Terminal başlık */}
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

        {/* Bildirimler listesi */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        >
          {notes.map((text, i) => (
            <View key={i} style={styles.noteRow}>
              <Text style={[styles.bullet, { fontFamily: MONO }]}>›</Text>
              <Text style={[styles.noteText, { fontFamily: MONO }]}>{text}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Devam butonu */}
        <TouchableOpacity onPress={onContinue} style={styles.btn} activeOpacity={0.8}>
          <Text style={[styles.btnText, { fontFamily: MONO }]}>{REPORT.continue_btn}</Text>
        </TouchableOpacity>

      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.80)',
  },
  sheet: {
    backgroundColor: '#0c0906',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderColor: '#1e1510',
    maxHeight: '70%',
  },
  termHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: '#110d09',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1c1510',
  },
  dots:       { flexDirection: 'row', gap: 5 },
  dot:        { width: 8, height: 8, borderRadius: 4 },
  headerText: {
    flex: 1,
    textAlign: 'center',
    color: '#888',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2.5,
  },
  scroll: { maxHeight: 240 },
  list:   { paddingHorizontal: 20, paddingVertical: 18, gap: 14 },
  noteRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  bullet: {
    color: '#3d3020',
    fontSize: 14,
    lineHeight: 19,
  },
  noteText: {
    flex: 1,
    color: '#888',
    fontSize: 12,
    lineHeight: 19,
  },
  btn: {
    marginHorizontal: 16,
    marginTop: 14,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#0e1e0e',
    borderWidth: 1,
    borderColor: '#1a3a1a',
    alignItems: 'center',
  },
  btnText: {
    color: '#2e7d32',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
  },
})
