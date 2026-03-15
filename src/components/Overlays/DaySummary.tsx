import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native'
import { useStatStore } from '../../store/useStatStore'
import { useGameStore } from '../../store/useGameStore'
import { StatType } from '../../types/stat.types'
import themeData from '../../data/theme.json'
import config from '../../data/config.json'
import uiData from '../../data/ui.json'

const C           = themeData.colors
const LABELS      = uiData.labels
const ROLE_LABELS = uiData.role_synergy_labels as Record<string, string>
const ROLE_COLORS = themeData.ui.role_colors   as Record<string, string>

const MONO       = Platform.select(themeData.ui.font_mono) as string
const DOTS       = themeData.ui.terminal_dots
const STAT_KEYS  = themeData.ui.stat_keys as StatType[]
const STAT_ICONS = themeData.ui.stat_icons as Record<StatType, string>
const STAT_SHORT = themeData.ui.stat_names_upper as Record<StatType, string>
const STAT_COLORS = themeData.ui.stat_colors as Record<StatType, string>
const STAT_MAX   = config.stat_max as Record<StatType, number>

interface Props {
  onContinue: () => void
  onBuilding: () => void
}

export const DaySummary: React.FC<Props> = ({ onContinue, onBuilding }) => {
  const stats = useStatStore()
  const game  = useGameStore()

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={onContinue}
      style={styles.overlay}
    >
      <View
        style={[styles.sheet, { paddingBottom: Platform.OS === 'android' ? 44 : 30 }]}
        onStartShouldSetResponder={() => false}
      >

        <View style={styles.termHeader}>
          <View style={styles.dots}>
            <View style={[styles.dot, { backgroundColor: DOTS[0] }]} />
            <View style={[styles.dot, { backgroundColor: DOTS[1] }]} />
            <View style={[styles.dot, { backgroundColor: DOTS[2] }]} />
          </View>
          <Text style={[styles.dayLabel, { fontFamily: MONO }]}>
            {LABELS.day_summary_header_prefix}{game.day}{LABELS.day_summary_header_suffix}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.statsBlock}>
          {STAT_KEYS.map(key => {
            const cur   = Math.round(stats.stats[key])
            const prev  = Math.round(stats.prevStats[key])
            const diff  = cur - prev
            const pct   = Math.min(1, Math.max(0, cur / STAT_MAX[key]))
            const isCrit = pct < 0.15
            const color = isCrit ? C.stat_critical : diff < 0 ? C.reject_glow : STAT_COLORS[key]

            return (
              <View key={key} style={styles.statRow}>

                <Text style={styles.statIcon}>{STAT_ICONS[key]}</Text>

                <Text style={[styles.statShort, { fontFamily: MONO, color: isCrit ? C.stat_critical : '#5a4a30' }]}>
                  {STAT_SHORT[key]}
                </Text>

                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${pct * 100}%` as any, backgroundColor: color }]} />
                </View>

                <Text style={[styles.statNum, { color: isCrit ? C.stat_critical : '#bbb' }]}>
                  {cur}
                </Text>

                <View style={[
                  styles.diffBox,
                  diff > 0 && styles.diffBoxPos,
                  diff < 0 && styles.diffBoxNeg,
                ]}>
                  <Text style={[
                    styles.diffText,
                    { color: diff > 0 ? C.accept_glow : diff < 0 ? C.reject_glow : '#2a2a2a' },
                  ]}>
                    {diff > 0 ? `+${diff}` : diff < 0 ? `${diff}` : '—'}
                  </Text>
                </View>

              </View>
            )
          })}
        </View>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
        </View>

        {Object.keys(game.acceptedRoleCounts).length > 0 && (
          <View style={styles.roleRow}>
            {Object.entries(game.acceptedRoleCounts).map(([role, count]) => {
              const color = ROLE_COLORS[role] ?? '#555'
              const label = ROLE_LABELS[role] ?? role
              return (
                <View key={role} style={[styles.roleChip, { borderColor: color + '44', backgroundColor: color + '11' }]}>
                  <Text style={[styles.roleCount, { color: color + 'cc', fontFamily: MONO }]}>{count}</Text>
                  <Text style={[styles.roleLabel, { color: color + '88', fontFamily: MONO }]}>{label}</Text>
                </View>
              )
            })}
          </View>
        )}

        <TouchableOpacity
          onPress={onBuilding}
          style={styles.buildingBtn}
          activeOpacity={0.8}
        >
          <View style={styles.buildingLeft}>
            <Text style={styles.buildingEmoji}>🏗</Text>
            <View>
              <Text style={[styles.buildingTitle, { fontFamily: MONO }]}>{LABELS.building_management}</Text>
              <Text style={styles.buildingSub}>{LABELS.building_management_sub}</Text>
            </View>
          </View>
          <Text style={styles.buildingArrow}>›</Text>
        </TouchableOpacity>

        <Text style={[styles.hint, { fontFamily: MONO }]}>{LABELS.continue_hint}</Text>

      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.75)',
  },

  sheet: {
    backgroundColor: C.background,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#3d2c1c',
    overflow: 'hidden',
  },

  termHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#2a1e10',
  },
  dots: { flexDirection: 'row', gap: 5 },
  dot:  { width: 9, height: 9, borderRadius: 5 },
  dayLabel: {
    flex: 1,
    textAlign: 'center',
    color: '#7a6040',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 3,
  },

  statsBlock: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 6,
    gap: 16,
  },

  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  statIcon: { fontSize: 16, width: 24, textAlign: 'center' },

  statShort: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    width: 72,
  },

  barTrack: {
    flex: 1,
    height: 10,
    backgroundColor: C.surface,
    borderRadius: 5,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2a1e10',
  },
  barFill: {
    height: '100%',
    borderRadius: 5,
  },

  statNum: {
    fontSize: 13,
    fontWeight: '700',
    width: 36,
    textAlign: 'right',
  },

  diffBox: {
    width: 40,
    paddingVertical: 3,
    borderRadius: 5,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  diffBoxPos: { backgroundColor: C.diff_pos_bg, borderWidth: 1, borderColor: '#1a3a1a' },
  diffBoxNeg: { backgroundColor: C.diff_neg_bg, borderWidth: 1, borderColor: '#3a0a0a' },
  diffText: {
    fontSize: 11,
    fontWeight: '800',
  },

  divider: {
    marginHorizontal: 20,
    marginVertical: 14,
  },
  dividerLine: {
    height: 1,
    backgroundColor: '#2a1e10',
  },

  roleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  roleCount: {
    fontSize: 12,
    fontWeight: '900',
  },
  roleLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  buildingBtn: {
    marginHorizontal: 16,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1000',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#3a2200',
    borderLeftWidth: 4,
    borderLeftColor: '#cc6600',
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  buildingLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  buildingEmoji: { fontSize: 24 },
  buildingTitle: {
    color: '#e8a840',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 3,
  },
  buildingSub: {
    color: '#6a5030',
    fontSize: 10,
  },
  buildingArrow: {
    color: '#cc6600',
    fontSize: 26,
    fontWeight: '900',
  },

  hint: {
    color: '#3a2e1e',
    fontSize: 9,
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 4,
  },
})
