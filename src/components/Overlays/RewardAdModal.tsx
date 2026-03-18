import React, { useEffect, useRef, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Platform, ActivityIndicator } from 'react-native'
import Animated, {
  useSharedValue, useAnimatedStyle,
  withRepeat, withSequence, withTiming,
} from 'react-native-reanimated'
import { RewardedAd, RewardedAdEventType, AdEventType, TestIds } from 'react-native-google-mobile-ads'
import { useGameStore } from '../../store/useGameStore'
import { useStatStore } from '../../store/useStatStore'
import { useProgressStore } from '../../store/useProgressStore'
import { useSettingsStore } from '../../store/useSettingsStore'
import { SaveSystem } from '../../domain/SaveSystem'
import themeData from '../../data/theme.json'
import config from '../../data/config.json'

const C    = themeData.colors
const TY   = themeData.typography as any
const SP   = themeData.spacing
const R    = themeData.radius
const MONO = Platform.select(themeData.ui.font_mono) as string

const STAT_ICONS   = themeData.ui.stat_icons   as Record<string, string>
const STAT_NAMES   = (themeData.ui as any).stat_names_tr as Record<string, string>
const STAT_COLORS  = {
  immunity:   C.stat_immunity,
  food:       C.stat_food,
  population: C.stat_population,
  defense:    C.stat_defense,
  economy:    C.stat_economy,
} as Record<string, string>

const AD_LIMITS    = (config as any).ad_limits       as Record<string, number>
const AD_REWARD    = (config as any).ad_reward_amount as number
const ANDROID_UNIT = (config as any).admob_android_rewarded as string
const IOS_UNIT     = (config as any).admob_ios_rewarded     as string

const REASON_STAT: Record<string, string> = {
  starvation: 'food',
  plague:     'immunity',
  breach:     'defense',
  extinction: 'population',
  collapse:   'economy',
}

const AD_UNIT_ID = __DEV__
  ? TestIds.REWARDED
  : (Platform.OS === 'android' ? ANDROID_UNIT : IOS_UNIT)

interface Props {
  reason: string
  onContinue: () => void
  onGameOver: () => void
}

export const RewardAdModal: React.FC<Props> = ({ reason, onContinue, onGameOver }) => {
  const game     = useGameStore()
  const stats    = useStatStore()
  const progress = useProgressStore()
  const settings = useSettingsStore()

  const adRef     = useRef<RewardedAd | null>(null)
  const earnedRef = useRef(false)
  const [adReady, setAdReady] = useState(false)
  const [loading, setLoading] = useState(false)

  const statKey  = REASON_STAT[reason] ?? 'food'
  const statIcon = STAT_ICONS[statKey]  ?? '?'
  const statName = STAT_NAMES[statKey]  ?? statKey
  const statColor= STAT_COLORS[statKey] ?? C.danger

  const adLimit = AD_LIMITS[settings.difficulty] ?? 0
  const adsLeft = adLimit - game.adsWatchedThisRun

  const pulseOp = useSharedValue(1)
  const borderAnim = useAnimatedStyle(() => ({ opacity: pulseOp.value }))

  useEffect(() => {
    pulseOp.value = withRepeat(
      withSequence(withTiming(0.3, { duration: 600 }), withTiming(1, { duration: 600 })),
      -1, true,
    )

    const ad = RewardedAd.createForAdRequest(AD_UNIT_ID, { requestNonPersonalizedAdsOnly: true })
    adRef.current = ad

    const loadedSub = ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
      setAdReady(true)
      setLoading(false)
    })

    const earnedSub = ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
      earnedRef.current = true
    })

    const closedSub = ad.addAdEventListener(AdEventType.CLOSED, () => {
      if (earnedRef.current) {
        stats.apply({ [statKey]: AD_REWARD } as any)
        game.incrementAdsWatched()
        game.setPendingAdReason(null)
        onContinue()
      } else {
        triggerGameOver()
      }
    })

    ad.load()

    return () => { loadedSub(); earnedSub(); closedSub() }
  }, [])

  const handleWatch = () => {
    if (adRef.current && adReady) {
      setLoading(true)
      adRef.current.show()
    }
  }

  const triggerGameOver = () => {
    game.setPendingAdReason(null)
    progress.updateBestRun(game.day, false)
    game.setGameOver(reason as any)
    progress.addSP((config as any).sp_rewards?.game_over ?? 0)
    SaveSystem.save({
      game: game as any,
      stats: stats as any,
      progress: progress as any,
      settings: settings as any,
    })
    onGameOver()
  }

  return (
    <View style={styles.overlay}>
      <View style={styles.sheet}>

        <Animated.View style={[StyleSheet.absoluteFillObject, styles.borderPulse, { borderColor: C.danger }, borderAnim]} pointerEvents="none" />

        <View style={styles.header}>
          <Text style={[styles.headerTag, { fontFamily: MONO }]}>⚠  ACİL DURUM  ⚠</Text>
        </View>

        <View style={styles.statRow}>
          <View style={[styles.statBadge, { borderColor: statColor + '55', backgroundColor: statColor + '14' }]}>
            <Text style={styles.statIcon}>{statIcon}</Text>
            <Text style={[styles.statLabel, { color: statColor, fontFamily: MONO }]}>
              {statName.toUpperCase()}
            </Text>
          </View>
          <Text style={[styles.zeroText, { fontFamily: MONO }]}>→ 0</Text>
        </View>

        <View style={styles.divider} />

        <Text style={[styles.bodyLine, { fontFamily: MONO }]}>
          {'>> ŞEHİR ÇÖKMEDİ — HENÜZ'}
        </Text>
        <Text style={styles.bodyDesc}>
          Acil tedarik için kaynak harca.{'\n'}
          <Text style={{ color: statColor, fontWeight: TY.weight_bold }}>+{AD_REWARD} {statName}</Text> kazanırsın.
        </Text>

        <View style={styles.chargeRow}>
          {Array.from({ length: adLimit }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.chargeDot,
                { backgroundColor: i < game.adsWatchedThisRun ? C.text_muted : C.accept },
              ]}
            />
          ))}
          <Text style={[styles.chargeLabel, { fontFamily: MONO }]}>
            {adsLeft} / {adLimit}  hak kaldı
          </Text>
        </View>

        <View style={styles.divider} />

        <TouchableOpacity
          style={[styles.btnWatch, !adReady && styles.btnDisabled]}
          onPress={handleWatch}
          disabled={!adReady || loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={C.bg_deeper} size="small" />
          ) : (
            <Text style={[styles.btnWatchText, { fontFamily: MONO }]}>
              {adReady ? `▶  KAYNAK AL  (+${AD_REWARD})` : '■  YÜKLENİYOR...'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btnDecline}
          onPress={triggerGameOver}
          activeOpacity={0.7}
        >
          <Text style={[styles.btnDeclineText, { fontFamily: MONO }]}>
            HAYIR — OYUN BİTSİN
          </Text>
        </TouchableOpacity>

      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: C.overlay_backdrop_dark,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 200,
  },
  sheet: {
    width: '88%',
    backgroundColor: C.bg_deeper,
    borderRadius: R.md,
    borderWidth: 1,
    borderColor: C.danger + '44',
    padding: SP.xl,
    alignItems: 'center',
    gap: SP.md,
    overflow: 'hidden',
  },
  borderPulse: {
    borderRadius: R.md,
    borderWidth: 2,
  },
  header: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: SP.xs,
  },
  headerTag: {
    fontSize: TY.size_note,
    color: C.danger,
    letterSpacing: 3,
    fontWeight: TY.weight_bold,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SP.md,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SP.sm,
    borderWidth: 1,
    borderRadius: R.sm,
    paddingHorizontal: SP.md,
    paddingVertical: SP.sm,
  },
  statIcon: {
    fontSize: TY.size_h5,
  },
  statLabel: {
    fontSize: TY.size_md,
    fontWeight: TY.weight_bold,
    letterSpacing: 1,
  },
  zeroText: {
    fontSize: TY.size_h4,
    color: C.danger,
    fontWeight: TY.weight_black,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: C.divider,
  },
  bodyLine: {
    fontSize: TY.size_xs,
    color: C.text_muted,
    letterSpacing: 1,
  },
  bodyDesc: {
    fontSize: TY.size_body,
    color: C.text_secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  chargeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SP.sm,
  },
  chargeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chargeLabel: {
    fontSize: TY.size_xs,
    color: C.text_muted,
    letterSpacing: 1,
    marginLeft: SP.xs,
  },
  btnWatch: {
    width: '100%',
    backgroundColor: C.accept,
    borderRadius: R.sm,
    paddingVertical: SP.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  btnDisabled: {
    backgroundColor: C.text_muted + '88',
  },
  btnWatchText: {
    fontSize: TY.size_sm,
    color: C.bg_deeper,
    fontWeight: TY.weight_black,
    letterSpacing: 1.5,
  },
  btnDecline: {
    paddingVertical: SP.sm,
    alignItems: 'center',
  },
  btnDeclineText: {
    fontSize: TY.size_xs,
    color: C.text_muted,
    letterSpacing: 1,
  },
})
