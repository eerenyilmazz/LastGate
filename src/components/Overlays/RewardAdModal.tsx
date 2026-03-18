import React, { useEffect, useRef, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Platform, ActivityIndicator } from 'react-native'
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

const AD_LIMITS      = (config as any).ad_limits      as Record<string, number>
const AD_REWARD      = (config as any).ad_reward_amount as number
const ANDROID_UNIT   = (config as any).admob_android_rewarded as string
const IOS_UNIT       = (config as any).admob_ios_rewarded     as string

const REASON_STAT: Record<string, string> = {
  starvation: 'food',
  plague:     'immunity',
  breach:     'defense',
  extinction: 'population',
  collapse:   'economy',
}

const REASON_LABEL: Record<string, string> = {
  starvation: 'Yiyecek',
  plague:     'Bağışıklık',
  breach:     'Savunma',
  extinction: 'Nüfus',
  collapse:   'Ekonomi',
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

  const adRef  = useRef<RewardedAd | null>(null)
  const [loading, setLoading]   = useState(false)
  const [adReady, setAdReady]   = useState(false)
  const earnedRef = useRef(false)

  const adLimit    = AD_LIMITS[settings.difficulty] ?? 0
  const adsLeft    = adLimit - game.adsWatchedThisRun
  const statName   = REASON_LABEL[reason] ?? reason
  const statKey    = REASON_STAT[reason]

  useEffect(() => {
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
        handleDecline()
      }
    })

    ad.load()

    return () => {
      loadedSub()
      earnedSub()
      closedSub()
    }
  }, [])

  const handleWatch = () => {
    if (adRef.current && adReady) {
      setLoading(true)
      adRef.current.show()
    }
  }

  const handleDecline = () => {
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
        <Text style={[styles.tag, { fontFamily: MONO }]}>[ KRİTİK ]</Text>
        <Text style={[styles.title, { fontFamily: MONO }]}>
          {statName.toUpperCase()} SIFIRA DÜŞTÜ
        </Text>

        <View style={styles.divider} />

        <Text style={styles.body}>
          Reklam izleyerek <Text style={{ color: C.accept, fontWeight: TY.weight_bold }}>+{AD_REWARD} {statName}</Text> kazan ve oyuna devam et.
        </Text>

        <Text style={[styles.counter, { fontFamily: MONO }]}>
          Kalan hak: {adsLeft} / {adLimit}
        </Text>

        <View style={styles.divider} />

        <TouchableOpacity
          style={[styles.btn, styles.btnWatch, !adReady && styles.btnDisabled]}
          onPress={handleWatch}
          disabled={!adReady || loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={C.background} size="small" />
          ) : (
            <Text style={[styles.btnText, { fontFamily: MONO, color: C.background }]}>
              {adReady ? '▶  REKLAM İZLE  +' + AD_REWARD : 'YÜKLENİYOR...'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, styles.btnDecline]}
          onPress={handleDecline}
          activeOpacity={0.8}
        >
          <Text style={[styles.btnText, { fontFamily: MONO, color: C.text_secondary }]}>
            HAYIR — OYUNU BİTİR
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
    backgroundColor: C.surface,
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: C.danger + '55',
    padding: SP.xl,
    alignItems: 'center',
    gap: SP.md,
  },
  tag: {
    fontSize: TY.size_caption,
    color: C.danger,
    letterSpacing: 2,
  },
  title: {
    fontSize: TY.size_h6,
    color: C.text_primary,
    fontWeight: TY.weight_bold,
    letterSpacing: 1,
    textAlign: 'center',
  },
  body: {
    fontSize: TY.size_body,
    color: C.text_secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  counter: {
    fontSize: TY.size_xs,
    color: C.text_muted,
    letterSpacing: 1,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: C.divider,
  },
  btn: {
    width: '100%',
    paddingVertical: SP.md,
    borderRadius: R.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  btnWatch: {
    backgroundColor: C.accept,
  },
  btnDisabled: {
    backgroundColor: C.text_muted,
  },
  btnDecline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: C.divider,
  },
  btnText: {
    fontSize: TY.size_sm,
    fontWeight: TY.weight_bold,
    letterSpacing: 1,
  },
})
