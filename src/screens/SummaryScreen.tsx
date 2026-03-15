import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Animated, {
  useSharedValue, useAnimatedStyle,
  withRepeat, withSequence, withTiming,
} from 'react-native-reanimated'
import { useStatStore } from '../store/useStatStore'
import { useProgressStore } from '../store/useProgressStore'
import { useGameStore } from '../store/useGameStore'
import { StatType } from '../types/stat.types'
import { AppBar } from '../components/AppBar'
import config from '../data/config.json'
import themeData from '../data/theme.json'
import uiData from '../data/ui.json'

const UI        = themeData.ui
const C         = themeData.colors
const STAT_KEYS = UI.stat_keys as StatType[]
const MONO      = Platform.select(UI.font_mono) as string
const L         = uiData.labels as Record<string, string>

interface Props {
  onRestart?: () => void
  onMainMenu?: () => void
}

export const SummaryScreen: React.FC<Props> = ({ onRestart, onMainMenu }) => {
  const stats    = useStatStore()
  const progress = useProgressStore()
  const game     = useGameStore()

  const pulse = useSharedValue(1)
  React.useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 1600 }),
        withTiming(0.94, { duration: 1600 }),
      ), -1, true,
    )
  }, [])
  const emblemStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }))

  return (
    <SafeAreaView style={styles.safe}>
      <AppBar onMainMenu={onMainMenu} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Başlık ── */}
        <View style={styles.header}>
          <Text style={[styles.tag, { fontFamily: MONO }]}>[ ZAFERLİ SON ]</Text>
          <Animated.Text style={[styles.emblem, emblemStyle]}>🏆</Animated.Text>
          <Text style={[styles.title, { fontFamily: MONO }]}>ŞEHİR KURTARILDI</Text>
          <Text style={styles.dayLine}>
            {game.day}. günde zafer
          </Text>
          <Text style={styles.sub}>
            {config.win_condition_day} günü geride bıraktın.{'\n'}
            Son Kapı hâlâ ayakta. Şehir yaşıyor.
          </Text>
        </View>

        {/* ── Divider ── */}
        <View style={styles.divider} />

        {/* ── Final stat tablosu ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { fontFamily: MONO }]}>— FİNAL DURUMU —</Text>
          {STAT_KEYS.map(key => {
            const val   = Math.round(stats.stats[key])
            const color = (C as any)[`stat_${key}`] as string
            const icon  = (UI.stat_icons as any)[key] as string
            const name  = (UI.stat_names_tr as any)[key] as string
            const max   = (config.stat_max as any)[key] as number
            const pct   = Math.min(1, val / max)
            return (
              <View key={key} style={styles.statRow}>
                <Text style={styles.statIcon}>{icon}</Text>
                <Text style={[styles.statName, { fontFamily: MONO }]}>{name}</Text>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${pct * 100}%` as any, backgroundColor: color }]} />
                </View>
                <Text style={[styles.statVal, { color, fontFamily: MONO }]}>{val}</Text>
              </View>
            )
          })}
        </View>

        {/* ── Divider ── */}
        <View style={styles.divider} />

        {/* ── SP ── */}
        <View style={styles.spRow}>
          <Text style={[styles.spLabel, { fontFamily: MONO }]}>TOPLAM SP</Text>
          <View style={styles.spRight}>
            <Text style={[styles.spStar, { fontFamily: MONO }]}>★</Text>
            <Text style={[styles.spNum, { fontFamily: MONO }]}>{progress.sp}</Text>
          </View>
        </View>

        {/* ── Butonlar ── */}
        <View style={styles.btnGroup}>
          <TouchableOpacity onPress={onRestart} style={styles.btnPrimary} activeOpacity={0.85}>
            <Text style={[styles.btnText, { fontFamily: MONO }]}>[ TEKRAR OYNA ]</Text>
          </TouchableOpacity>

          {onMainMenu && (
            <TouchableOpacity onPress={onMainMenu} style={styles.btnSecondary} activeOpacity={0.8}>
              <Text style={[styles.btnSecText, { fontFamily: MONO }]}>[ ANA MENÜ ]</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#090604' },
  scroll: { paddingHorizontal: 20, paddingTop: 24 },

  header: { alignItems: 'center', gap: 6, marginBottom: 24 },
  tag: {
    color: '#2e7d32',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 3,
    marginBottom: 4,
  },
  emblem: {
    fontSize: 48,
    marginVertical: 4,
  },
  title: {
    color: '#e8e8e8',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 6,
    textAlign: 'center',
    textShadowColor: '#4caf5044',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  dayLine: {
    color: '#4caf50',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 2,
  },
  sub: {
    color: '#4a3a2a',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 4,
  },

  divider: {
    height: 1,
    backgroundColor: '#1e1510',
    marginVertical: 16,
  },

  section: { gap: 6, marginBottom: 4 },
  sectionLabel: {
    color: '#2a2a2a',
    fontSize: 9,
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 8,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#12100c',
  },
  statIcon: { fontSize: 14, width: 20, textAlign: 'center' },
  statName: { width: 72, color: '#555', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  barTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#1a1410',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 3 },
  statVal: { width: 32, fontSize: 12, fontWeight: '800', textAlign: 'right' },

  spRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#100d08',
    borderWidth: 1,
    borderColor: '#221500',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 20,
  },
  spLabel: { color: '#4a3a1a', fontSize: 11, fontWeight: '800', letterSpacing: 2 },
  spRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  spStar:  { color: '#f57c00', fontSize: 14 },
  spNum:   { color: '#f57c00', fontSize: 24, fontWeight: '900' },

  btnGroup: { gap: 8 },
  btnPrimary: {
    backgroundColor: '#0a1e0a',
    borderWidth: 1,
    borderColor: '#1b5e20',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnSecondary: {
    backgroundColor: '#100e0b',
    borderWidth: 1,
    borderColor: '#1e1a14',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnText:    { color: '#4caf50', fontSize: 13, fontWeight: '900', letterSpacing: 2 },
  btnSecText: { color: '#333', fontSize: 11, fontWeight: '700', letterSpacing: 2 },
})
