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

const TY = themeData.typography as any
const SP = themeData.spacing
const R  = themeData.radius
const UI        = themeData.ui
const C         = themeData.colors
const STAT_KEYS = UI.stat_keys as StatType[]
const MONO      = Platform.select(UI.font_mono) as string
const L         = uiData.labels as Record<string, string>
const STRINGS   = (uiData as any).strings as Record<string, string>

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

        <View style={styles.header}>
          <Text style={[styles.tag, { fontFamily: MONO }]}>{STRINGS.summary_victory_tag}</Text>
          <Animated.Text style={[styles.emblem, emblemStyle]}>🏆</Animated.Text>
          <Text style={[styles.title, { fontFamily: MONO }]}>{STRINGS.summary_victory_title}</Text>
          <Text style={styles.dayLine}>
            {game.day}. günde zafer
          </Text>
          <Text style={styles.sub}>
            {config.win_condition_day} günü geride bıraktın.{'\n'}
            Son Kapı hâlâ ayakta. Şehir yaşıyor.
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { fontFamily: MONO }]}>{STRINGS.summary_status_label}</Text>
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

        <View style={styles.divider} />

        <View style={styles.spRow}>
          <Text style={[styles.spLabel, { fontFamily: MONO }]}>{STRINGS.summary_sp_label}</Text>
          <View style={styles.spRight}>
            <Text style={[styles.spStar, { fontFamily: MONO }]}>★</Text>
            <Text style={[styles.spNum, { fontFamily: MONO }]}>{progress.sp}</Text>
          </View>
        </View>

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
  safe:   { flex: 1, backgroundColor: C.bg_deeper },
  scroll: { paddingHorizontal: 20, paddingTop: 24 },

  header: { alignItems: 'center', gap: 6, marginBottom: 24 },
  tag: {
    color: C.accept,
    fontSize: TY.size_caption,
    fontWeight: TY.weight_black,
    letterSpacing: 3,
    marginBottom: 4,
  },
  emblem: {
    fontSize: TY.size_banner,
    marginVertical: 4,
  },
  title: {
    color: C.text_bright,
    fontSize: TY.size_h5,
    fontWeight: TY.weight_black,
    letterSpacing: 6,
    textAlign: 'center',
    textShadowColor: (C.accept_glow + '44'),
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  dayLine: {
    color: C.accept_glow,
    fontSize: TY.size_body,
    fontWeight: TY.weight_bold,
    letterSpacing: 1,
    marginTop: 2,
  },
  sub: {
    color: C.text_muted,
    fontSize: TY.size_sm,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 4,
  },

  divider: {
    height: 1,
    backgroundColor: C.card_dark,
    marginVertical: 16,
  },

  section: { gap: 6, marginBottom: 4 },
  sectionLabel: {
    color: C.text_muted,
    fontSize: TY.size_caption,
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
    borderBottomColor: C.bg_deeper,
  },
  statIcon: { fontSize: TY.size_md, width: 20, textAlign: 'center' },
  statName: { width: 72, color: C.text_muted, fontSize: TY.size_xs, fontWeight: TY.weight_bold, letterSpacing: 0.5 },
  barTrack: {
    flex: 1,
    height: 6,
    backgroundColor: C.card_dark,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 3 },
  statVal: { width: 32, fontSize: TY.size_sm, fontWeight: TY.weight_heavy, textAlign: 'right' },

  spRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: C.bg_deeper,
    borderWidth: 1,
    borderColor: C.button_border,
    borderRadius: R.pill,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 20,
  },
  spLabel: { color: C.text_muted, fontSize: TY.size_note, fontWeight: TY.weight_heavy, letterSpacing: 2 },
  spRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  spStar:  { color: C.query, fontSize: TY.size_md },
  spNum:   { color: C.query, fontSize: TY.size_xl, fontWeight: TY.weight_black },

  btnGroup: { gap: 8 },
  btnPrimary: {
    backgroundColor: C.diff_pos_bg,
    borderWidth: 1,
    borderColor: C.accept,
    borderRadius: R.pill,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnSecondary: {
    backgroundColor: C.bg_deeper,
    borderWidth: 1,
    borderColor: C.card_dark,
    borderRadius: R.pill,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnText:    { color: C.accept_glow, fontSize: TY.size_body, fontWeight: TY.weight_black, letterSpacing: 2 },
  btnSecText: { color: C.text_muted, fontSize: TY.size_note, fontWeight: TY.weight_bold, letterSpacing: 2 },
})
