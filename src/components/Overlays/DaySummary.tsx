import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native'
import { useStatStore } from '../../store/useStatStore'
import { useGameStore } from '../../store/useGameStore'
import { StatType } from '../../types/stat.types'
import themeData from '../../data/theme.json'
import config from '../../data/config.json'
import uiData from '../../data/ui.json'

const TY = themeData.typography
const SP = themeData.spacing
const R  = themeData.radius
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
          {game.daySpEarned > 0
            ? <View style={styles.spBadge}>
                <Text style={[styles.spBadgeText, { fontFamily: MONO }]}>+{game.daySpEarned} SP</Text>
              </View>
            : <View style={{ width: 40 }} />
          }
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

                <Text style={[styles.statShort, { fontFamily: MONO, color: isCrit ? C.stat_critical : C.text_secondary }]}>
                  {STAT_SHORT[key]}
                </Text>

                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${pct * 100}%` as any, backgroundColor: color }]} />
                </View>

                <Text style={[styles.statNum, { color: isCrit ? C.stat_critical : C.text_bright }]}>
                  {cur}
                </Text>

                <View style={[
                  styles.diffBox,
                  diff > 0 && styles.diffBoxPos,
                  diff < 0 && styles.diffBoxNeg,
                ]}>
                  <Text style={[
                    styles.diffText,
                    { color: diff > 0 ? C.accept_glow : diff < 0 ? C.reject_glow : C.button_border },
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

        {game.notifications.length > 0 && (
          <View style={styles.notifBlock}>
            {game.notifications.map((note, i) => (
              <View key={i} style={styles.notifRow}>
                <Text style={[styles.notifText, { fontFamily: MONO }]}>{'⚠ '}{note}</Text>
              </View>
            ))}
          </View>
        )}

        {Object.keys(game.acceptedRoleCounts).length > 0 && (
          <View style={styles.roleRow}>
            {Object.entries(game.acceptedRoleCounts).map(([role, count]) => {
              const color = ROLE_COLORS[role] ?? C.text_muted
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
    borderColor: C.divider,
    overflow: 'hidden',
  },

  termHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.divider,
  },
  dots: { flexDirection: 'row', gap: 5 },
  dot:  { width: 9, height: 9, borderRadius: R.xs },
  dayLabel: {
    flex: 1,
    textAlign: 'center',
    color: C.text_muted,
    fontSize: TY.size_note,
    fontWeight: TY.weight_heavy,
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

  statIcon: { fontSize: TY.size_h6, width: 24, textAlign: 'center' },

  statShort: {
    fontSize: TY.size_caption,
    fontWeight: TY.weight_heavy,
    letterSpacing: 0.5,
    width: 72,
  },

  barTrack: {
    flex: 1,
    height: 10,
    backgroundColor: C.surface,
    borderRadius: R.xs,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.divider,
  },
  barFill: {
    height: '100%',
    borderRadius: R.xs,
  },

  statNum: {
    fontSize: TY.size_body,
    fontWeight: TY.weight_bold,
    width: 36,
    textAlign: 'right',
  },

  diffBox: {
    width: 40,
    paddingVertical: 3,
    borderRadius: R.xs,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  diffBoxPos: { backgroundColor: C.diff_pos_bg, borderWidth: 1, borderColor: C.border_pos },
  diffBoxNeg: { backgroundColor: C.diff_neg_bg, borderWidth: 1, borderColor: C.border_neg },
  diffText: {
    fontSize: TY.size_note,
    fontWeight: TY.weight_heavy,
  },

  divider: {
    marginHorizontal: 20,
    marginVertical: 14,
  },
  dividerLine: {
    height: 1,
    backgroundColor: C.divider,
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
    borderRadius: R.md,
    borderWidth: 1,
  },
  roleCount: {
    fontSize: TY.size_sm,
    fontWeight: TY.weight_black,
  },
  roleLabel: {
    fontSize: TY.size_caption,
    fontWeight: TY.weight_bold,
    letterSpacing: 0.5,
  },

  buildingBtn: {
    marginHorizontal: 16,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card_dark,
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: C.divider,
    borderLeftWidth: 4,
    borderLeftColor: C.query,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  buildingLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  buildingEmoji: { fontSize: TY.size_xl },
  buildingTitle: {
    color: C.query,
    fontSize: TY.size_sm,
    fontWeight: TY.weight_black,
    letterSpacing: 1.5,
    marginBottom: 3,
  },
  buildingSub: {
    color: C.text_secondary,
    fontSize: TY.size_xs,
  },
  buildingArrow: {
    color: C.query,
    fontSize: TY.size_xl_alt,
    fontWeight: TY.weight_black,
  },

  hint: {
    color: C.button_border,
    fontSize: TY.size_caption,
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 4,
  },

  spBadge: {
    backgroundColor: C.query + '22',
    borderWidth: 1,
    borderColor: C.query + '88',
    borderRadius: R.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
    minWidth: 52,
    alignItems: 'center',
  },
  spBadgeText: {
    color: C.query,
    fontSize: TY.size_caption,
    fontWeight: TY.weight_black,
    letterSpacing: 1,
  },

  notifBlock: {
    marginHorizontal: 16,
    marginBottom: 12,
    gap: 6,
  },
  notifRow: {
    backgroundColor: C.danger_dark + '33',
    borderLeftWidth: 3,
    borderLeftColor: C.danger,
    borderRadius: R.xs,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  notifText: {
    color: C.danger,
    fontSize: TY.size_xs,
    fontWeight: TY.weight_semi,
  },
})
