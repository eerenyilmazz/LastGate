import React, { useEffect, useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  Platform, ActivityIndicator,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRewardedAd } from '../../hooks/useRewardedAd'
import { useSettingsStore } from '../../store/useSettingsStore'
import { GameOverReason } from '../../types/game.types'
import themeData from '../../data/theme.json'
import { ms } from '../../utils/scale'

const C    = themeData.colors
const TY   = themeData.typography as any
const R    = themeData.radius
const MONO = Platform.select(themeData.ui.font_mono) as string

const REASON_LABELS: Record<GameOverReason, { icon: string; stat: string; rescue: string }> = {
  starvation: { icon: '🌾', stat: 'Yiyecek',    rescue: '+25 Yiyecek' },
  plague:     { icon: '💊', stat: 'Bağışıklık', rescue: '+20 Bağışıklık' },
  breach:     { icon: '🛡', stat: 'Savunma',    rescue: '+20 Savunma' },
  extinction: { icon: '👥', stat: 'Nüfus',      rescue: '+15 Nüfus' },
  collapse:   { icon: '💰', stat: 'Ekonomi',    rescue: '+20 Ekonomi' },
  victory:    { icon: '🏆', stat: '',           rescue: '' },
}


interface Props {
  reason:    GameOverReason
  onRescue:  () => void
  onGiveUp:  () => void
}

export const StatRescue: React.FC<Props> = ({ reason, onRescue, onGiveUp }) => {
  const insets   = useSafeAreaInsets()
  const settings = useSettingsStore()
  const ad       = useRewardedAd()

  const [adLoading, setAdLoading] = useState(false)
  const [adTimedOut, setAdTimedOut] = useState(false)

  useEffect(() => {
    ad.load()
    const timer = setTimeout(() => setAdTimedOut(true), 15000)
    return () => clearTimeout(timer)
  }, [])

  // Yüklenirse timeout'u sıfırla
  useEffect(() => {
    if (ad.isLoaded) setAdTimedOut(false)
  }, [ad.isLoaded])

  const info       = REASON_LABELS[reason]
  const canAd      = ad.isAvailable && ad.canShow(settings.difficulty)
  const adReady    = canAd && ad.isLoaded
  const adFetching = canAd && !ad.isLoaded && !adTimedOut

  const handleAd = () => {
    if (adLoading || !ad.isLoaded) return
    setAdLoading(true)
    ad.show(result => {
      setAdLoading(false)
      if (result === 'earned') onRescue()
    })
  }

  return (
    <View style={[styles.overlay, { paddingBottom: insets.bottom + 20 }]}>
      <View style={styles.card}>

        <Text style={styles.warningIcon}>⚠️</Text>
        <Text style={[styles.title, { fontFamily: MONO }]}>KRİTİK TEHLİKE</Text>
        <Text style={[styles.sub, { fontFamily: MONO }]}>
          {info.icon} {info.stat} kritik seviyeye düştü
        </Text>
        <Text style={[styles.rescue, { fontFamily: MONO }]}>{info.rescue} kurtarma</Text>

        <View style={styles.divider} />

        {canAd && !adTimedOut && (
          <TouchableOpacity
            style={[styles.adBtn, (!adReady || adLoading) && { opacity: 0.5 }]}
            onPress={handleAd}
            activeOpacity={0.8}
            disabled={adLoading || !adReady}
          >
            {(adLoading || adFetching)
              ? <ActivityIndicator size="small" color={C.query} />
              : <Text style={styles.adBtnIcon}>📺</Text>
            }
            <View style={{ flex: 1 }}>
              <Text style={[styles.adBtnTitle, { fontFamily: MONO }]}>
                {adFetching ? 'Reklam yükleniyor...' : 'Reklam İzle'}
              </Text>
              <Text style={[styles.adBtnSub, { fontFamily: MONO }]}>Ücretsiz kurtarma</Text>
            </View>
            {adReady && <Text style={[styles.adBtnArrow, { color: C.query }]}>›</Text>}
          </TouchableOpacity>
        )}
        {canAd && adTimedOut && !adReady && (
          <View style={[styles.adBtn, { opacity: 0.4 }]}>
            <Text style={styles.adBtnIcon}>📵</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.adBtnTitle, { fontFamily: MONO, color: C.text_muted }]}>
                Reklam şu an mevcut değil
              </Text>
              <Text style={[styles.adBtnSub, { fontFamily: MONO }]}>Daha sonra tekrar dene</Text>
            </View>
          </View>
        )}

        <TouchableOpacity style={styles.giveUpBtn} onPress={onGiveUp} activeOpacity={0.7}>
          <Text style={[styles.giveUpText, { fontFamily: MONO }]}>Teslim Ol</Text>
        </TouchableOpacity>

      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: ms(24),
  },
  card: {
    width: '100%',
    backgroundColor: C.background,
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: C.danger + '66',
    padding: ms(20),
    alignItems: 'center',
    gap: ms(10),
  },
  warningIcon: { fontSize: ms(36), marginBottom: ms(4) },
  title: {
    color: C.danger,
    fontSize: TY.size_body,
    fontWeight: TY.weight_black,
    letterSpacing: 3,
  },
  sub: {
    color: C.text_secondary,
    fontSize: TY.size_xs,
    letterSpacing: 1,
  },
  rescue: {
    color: C.accept_glow,
    fontSize: TY.size_xs,
    fontWeight: TY.weight_bold,
    letterSpacing: 1,
  },
  divider: {
    height: 1,
    width: '100%',
    backgroundColor: C.divider,
    marginVertical: 6,
  },
  adBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(12),
    width: '100%',
    backgroundColor: C.query + '11',
    borderWidth: 1,
    borderColor: C.query + '44',
    borderRadius: R.md,
    paddingVertical: ms(14),
    paddingHorizontal: ms(16),
  },
  adBtnIcon: { fontSize: ms(22) },
  adBtnTitle: {
    color: C.query,
    fontSize: TY.size_xs,
    fontWeight: TY.weight_black,
    letterSpacing: 1,
  },
  adBtnSub: {
    color: C.text_muted,
    fontSize: TY.size_caption,
    marginTop: 2,
  },
  adBtnArrow: { fontSize: ms(22), fontWeight: TY.weight_black },
  spBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(12),
    width: '100%',
    backgroundColor: C.accept + '11',
    borderWidth: 1,
    borderColor: C.accept + '44',
    borderRadius: R.md,
    paddingVertical: ms(14),
    paddingHorizontal: ms(16),
  },
  spBtnDisabled: {
    borderColor: C.button_border,
    backgroundColor: 'transparent',
    opacity: 0.5,
  },
  spBtnTitle: {
    fontSize: TY.size_xs,
    fontWeight: TY.weight_black,
    letterSpacing: 1,
  },
  giveUpBtn: {
    marginTop: ms(6),
    paddingVertical: ms(10),
    paddingHorizontal: ms(24),
  },
  giveUpText: {
    color: C.text_muted,
    fontSize: TY.size_xs,
    letterSpacing: 2,
    textDecorationLine: 'underline',
  },
})
