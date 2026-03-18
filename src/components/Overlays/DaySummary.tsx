import React, { useEffect, useRef, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Platform, ActivityIndicator } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
let RewardedAd: any, RewardedAdEventType: any, AdEventType: any, TestIds: any
try {
  const ads = require('react-native-google-mobile-ads')
  RewardedAd = ads.RewardedAd; RewardedAdEventType = ads.RewardedAdEventType
  AdEventType = ads.AdEventType; TestIds = ads.TestIds
} catch {
  RewardedAd = null
  RewardedAdEventType = { LOADED: 'loaded', EARNED_REWARD: 'earned_reward' }
  AdEventType = { CLOSED: 'closed', ERROR: 'error' }
  TestIds = { REWARDED: '' }
}
import { useStatStore } from '../../store/useStatStore'
import { useGameStore } from '../../store/useGameStore'
import { useSettingsStore } from '../../store/useSettingsStore'
import { useProgressStore } from '../../store/useProgressStore'
import { StatType } from '../../types/stat.types'
import themeData from '../../data/theme.json'
import config from '../../data/config.json'
import uiData from '../../data/ui.json'

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

const SP_MULTS   = (config as any).ad_sp_multipliers as Record<string, number>
const ANDROID_UNIT = (config as any).admob_android_rewarded as string
const IOS_UNIT     = (config as any).admob_ios_rewarded     as string
const AD_UNIT_ID   = __DEV__
  ? TestIds.REWARDED
  : (Platform.OS === 'android' ? ANDROID_UNIT : IOS_UNIT)

interface Props {
  onContinue: () => void
  onBuilding: () => void
}

type AdState = 'idle' | 'confirm' | 'loading' | 'done'

export const DaySummary: React.FC<Props> = ({ onContinue, onBuilding }) => {
  const insets   = useSafeAreaInsets()
  const stats    = useStatStore()
  const game     = useGameStore()
  const settings = useSettingsStore()
  const progress = useProgressStore()

  const [adState, setAdState] = useState<AdState>('idle')
  const adRef     = useRef<RewardedAd | null>(null)
  const earnedRef = useRef(false)

  const mult      = SP_MULTS[settings.difficulty] ?? 1.0
  const bonusSP   = Math.max(1, Math.round(game.daySpEarned * mult))

  useEffect(() => {
    if (game.spAdUsedToday || game.daySpEarned <= 0 || !RewardedAd) return
    const ad = RewardedAd.createForAdRequest(AD_UNIT_ID, { requestNonPersonalizedAdsOnly: true })
    adRef.current = ad
    ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
      if (adState === 'loading') setAdState('loading')
    })
    ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
      earnedRef.current = true
    })
    ad.addAdEventListener(AdEventType.CLOSED, () => {
      if (earnedRef.current) {
        progress.addSP(bonusSP)
        game.setSpAdUsedToday(true)
        setAdState('done')
      } else {
        setAdState('idle')
      }
    })
    ad.load()
    return () => { adRef.current = null }
  }, [])

  const handleConfirmWatch = () => {
    earnedRef.current = false
    setAdState('loading')
    adRef.current?.show()
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

        {game.daySpEarned > 0 && !game.spAdUsedToday && adState !== 'done' && (
          <View style={styles.spAdBlock}>
            {adState === 'idle' && (
              <TouchableOpacity
                style={styles.spAdBtn}
                activeOpacity={0.85}
                onPress={() => setAdState('confirm')}
              >
                <Text style={styles.spAdIcon}>📺</Text>
                <View style={styles.spAdCenter}>
                  <Text style={[styles.spAdTitle, { fontFamily: MONO }]}>BONUS SP KAZAN</Text>
                  <Text style={styles.spAdSub}>Bugünkü kazancına +{bonusSP} SP ekle</Text>
                </View>
                <Text style={[styles.spAdAmount, { fontFamily: MONO }]}>+{bonusSP}</Text>
              </TouchableOpacity>
            )}

            {adState === 'confirm' && (
              <View style={styles.spConfirm}>
                <Text style={[styles.spConfirmText, { fontFamily: MONO }]}>
                  Reklam izleyerek <Text style={{ color: C.query }}>+{bonusSP} SP</Text> kazanmak ister misin?
                </Text>
                <View style={styles.spConfirmRow}>
                  <TouchableOpacity style={styles.spConfirmYes} activeOpacity={0.85} onPress={handleConfirmWatch}>
                    <Text style={[styles.spConfirmYesText, { fontFamily: MONO }]}>EVET, İZLE</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.spConfirmNo} activeOpacity={0.7} onPress={() => setAdState('idle')}>
                    <Text style={[styles.spConfirmNoText, { fontFamily: MONO }]}>HAYIR</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {adState === 'loading' && (
              <View style={styles.spLoading}>
                <ActivityIndicator color={C.query} size="small" />
                <Text style={[styles.spLoadingText, { fontFamily: MONO }]}>YÜKLENİYOR...</Text>
              </View>
            )}
          </View>
        )}

        {adState === 'done' && (
          <View style={styles.spDone}>
            <Text style={[styles.spDoneText, { fontFamily: MONO }]}>✓  +{bonusSP} SP KAZANILDI</Text>
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

  spAdBlock: {
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: R.md,
    borderWidth: 1,
    borderColor: C.query + '44',
    overflow: 'hidden',
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
