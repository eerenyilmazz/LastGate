import React, { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Platform, ScrollView, ActivityIndicator } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useStatStore } from '../../store/useStatStore'
import { useGameStore } from '../../store/useGameStore'
import { useSettingsStore } from '../../store/useSettingsStore'
import { useRewardedAd } from '../../hooks/useRewardedAd'
import { StatType } from '../../types/stat.types'
import themeData from '../../data/theme.json'
import config from '../../data/config.json'
import uiData from '../../data/ui.json'
import { ms, s } from '../../utils/scale'

const TY = themeData.typography as any
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
  onAdSP: (amount: number) => void
}

export const DaySummary: React.FC<Props> = ({ onContinue, onBuilding, onAdSP }) => {
  const insets   = useSafeAreaInsets()
  const stats    = useStatStore()
  const game     = useGameStore()
  const settings = useSettingsStore()
  const ad       = useRewardedAd()
  const [adLoading, setAdLoading] = useState(false)
  const [adDone, setAdDone]       = useState(false)

  useEffect(() => { ad.load() }, [])

  const canWatchAd   = ad.isAvailable && ad.canShow(settings.difficulty) && !adDone
  const adReady      = canWatchAd && ad.isLoaded
  const adFetching   = canWatchAd && !ad.isLoaded
  const reward       = ad.spReward(settings.difficulty)

  const handleAdPress = () => {
    if (adLoading || !ad.isLoaded) return
    setAdLoading(true)
    ad.show(result => {
      setAdLoading(false)
      if (result === 'earned') {
        setAdDone(true)
        onAdSP(reward)
      }
    })
  }

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={onContinue}
      style={styles.overlay}
    >
      <View
        style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}
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

        {game.activeModifier && (
          <View style={styles.modRow}>
            <Text style={styles.modIcon}>{game.activeModifier.icon}</Text>
            <View style={styles.modText}>
              <Text style={[styles.modName, { fontFamily: MONO }]}>{game.activeModifier.name}</Text>
              <Text style={[styles.modDesc, { fontFamily: MONO }]}>{game.activeModifier.description}</Text>
            </View>
          </View>
        )}

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
        </View>

        {game.notifications.length > 0 && (
          <ScrollView
            style={styles.notifBlock}
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
          >
            {game.notifications.map((note, i) => (
              <View key={i} style={styles.notifRow}>
                <Text style={[styles.notifText, { fontFamily: MONO }]}>{note}</Text>
              </View>
            ))}
          </ScrollView>
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

        {canWatchAd && (
          <TouchableOpacity
            onPress={handleAdPress}
            style={[styles.spAdBlock, !adReady && styles.spAdBlockDim]}
            activeOpacity={0.8}
            disabled={adLoading || !adReady}
          >
            <Text style={styles.spAdIcon}>📺</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.spAdTitle, { fontFamily: MONO }]}>Reklam İzle → +{reward} SP</Text>
              <Text style={[styles.spAdSub, { fontFamily: MONO }]}>
                {adFetching ? 'Yükleniyor...' : 'Günde bir kez'}
              </Text>
            </View>
            {adLoading || adFetching
              ? <ActivityIndicator size="small" color={C.query} />
              : <Text style={[styles.spAdArrow, { color: C.query }]}>›</Text>
            }
          </TouchableOpacity>
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
    backgroundColor: C.overlay_backdrop_mid,
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
    paddingHorizontal: ms(20),
    paddingTop: ms(16),
    paddingBottom: ms(6),
    gap: ms(14),
  },

  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(8),
  },

  statIcon: { fontSize: TY.size_h6, width: ms(24), textAlign: 'center' },

  statShort: {
    fontSize: TY.size_caption,
    fontWeight: TY.weight_heavy,
    letterSpacing: 0.5,
    width: s(72),
  },

  barTrack: {
    flex: 1,
    height: ms(10),
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
    width: ms(36),
    textAlign: 'right',
  },

  diffBox: {
    width: ms(40),
    paddingVertical: ms(3),
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

  modRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(10),
    marginHorizontal: ms(20),
    marginTop: ms(12),
    paddingVertical: ms(10),
    paddingHorizontal: ms(12),
    borderRadius: R.md,
    borderWidth: 1,
    borderColor: C.query + '44',
    backgroundColor: C.query + '0d',
  },
  modIcon: { fontSize: ms(22) },
  modText: { flex: 1 },
  modName: {
    color: C.query,
    fontSize: TY.size_caption,
    fontWeight: TY.weight_black,
    letterSpacing: 1,
    marginBottom: 2,
  },
  modDesc: {
    color: C.text_secondary,
    fontSize: TY.size_caption,
    letterSpacing: 0.3,
  },

  divider: {
    marginHorizontal: ms(20),
    marginVertical: ms(12),
  },
  dividerLine: {
    height: 1,
    backgroundColor: C.divider,
  },

  roleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ms(6),
    paddingHorizontal: ms(16),
    marginBottom: ms(12),
  },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(4),
    paddingHorizontal: ms(9),
    paddingVertical: ms(5),
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

  spAdBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(10),
    marginHorizontal: ms(16),
    marginBottom: ms(10),
    borderRadius: R.md,
    borderWidth: 1,
    borderColor: C.query + '44',
    backgroundColor: C.query + '11',
    paddingVertical: ms(12),
    paddingHorizontal: ms(14),
    overflow: 'hidden',
  },
  spAdBlockDim: {
    opacity: 0.45,
  },
  spAdBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.query + '11',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 10,
  },
  spAdIcon: { fontSize: TY.size_h5 },
  spAdCenter: { flex: 1 },
  spAdTitle: {
    color: C.query,
    fontSize: TY.size_xs,
    fontWeight: TY.weight_black,
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  spAdSub: {
    color: C.text_muted,
    fontSize: TY.size_caption,
  },
  spAdArrow: {
    fontSize: TY.size_h5,
    fontWeight: TY.weight_black,
  },
  spAdAmount: {
    color: C.query,
    fontSize: TY.size_h6,
    fontWeight: TY.weight_black,
  },
  spConfirm: {
    backgroundColor: C.query + '0d',
    padding: 14,
    gap: 10,
  },
  spConfirmText: {
    color: C.text_secondary,
    fontSize: TY.size_xs,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  spConfirmRow: {
    flexDirection: 'row',
    gap: 8,
  },
  spConfirmYes: {
    flex: 1,
    backgroundColor: C.query,
    borderRadius: R.sm,
    paddingVertical: 10,
    alignItems: 'center',
  },
  spConfirmYesText: {
    color: C.bg_deeper,
    fontSize: TY.size_xs,
    fontWeight: TY.weight_black,
    letterSpacing: 1.5,
  },
  spConfirmNo: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spConfirmNoText: {
    color: C.text_muted,
    fontSize: TY.size_xs,
    letterSpacing: 1,
  },
  spLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 14,
    backgroundColor: C.query + '0d',
  },
  spLoadingText: {
    color: C.text_muted,
    fontSize: TY.size_xs,
    letterSpacing: 1,
  },
  spDone: {
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: C.accept + '14',
    borderRadius: R.md,
    borderWidth: 1,
    borderColor: C.accept + '44',
    paddingVertical: 10,
    alignItems: 'center',
  },
  spDoneText: {
    color: C.accept,
    fontSize: TY.size_xs,
    fontWeight: TY.weight_black,
    letterSpacing: 2,
  },

  buildingBtn: {
    marginHorizontal: ms(16),
    marginBottom: ms(12),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card_dark,
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: C.divider,
    borderLeftWidth: 4,
    borderLeftColor: C.query,
    paddingVertical: ms(14),
    paddingHorizontal: ms(14),
  },
  buildingLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(12),
  },
  buildingEmoji: { fontSize: ms(TY.size_xl) },
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
    color: C.text_bright,
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
    marginHorizontal: ms(16),
    marginBottom: ms(10),
    maxHeight: ms(110),
    gap: ms(5),
  },
  notifRow: {
    backgroundColor: C.surface,
    borderLeftWidth: 3,
    borderLeftColor: C.danger,
    borderRadius: R.xs,
    paddingVertical: ms(8),
    paddingHorizontal: ms(10),
  },
  notifText: {
    flex: 1,
    color: C.text_bright,
    fontSize: TY.size_xs,
    fontWeight: TY.weight_semi,
    lineHeight: 16,
  },
})
