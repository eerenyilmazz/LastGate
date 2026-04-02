import React, { useEffect, useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  Platform, ActivityIndicator,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRewardedAd } from '../../hooks/useRewardedAd'
import { useSettingsStore } from '../../store/useSettingsStore'
import { useProgressStore } from '../../store/useProgressStore'
import { GameOverReason } from '../../types/game.types'
import themeData from '../../data/theme.json'

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

const SP_COST: Record<string, number> = { easy: 15, normal: 25, hard: 40 }

interface Props {
  reason:    GameOverReason
  onRescue:  (method: 'ad' | 'sp') => void
  onGiveUp:  () => void
}

export const StatRescue: React.FC<Props> = ({ reason, onRescue, onGiveUp }) => {
  const insets   = useSafeAreaInsets()
  const settings = useSettingsStore()
  const progress = useProgressStore()
  const ad       = useRewardedAd()

  const [adLoading, setAdLoading] = useState(false)

  useEffect(() => { ad.load() }, [])

  const info     = REASON_LABELS[reason]
  const spCost   = SP_COST[settings.difficulty] ?? 25
  const canAd    = ad.isAvailable && ad.canShow(settings.difficulty)
  const canSP    = progress.sp >= spCost

  const handleAd = () => {
    if (adLoading) return
    setAdLoading(true)
    ad.show(result => {
      setAdLoading(false)
      if (result === 'earned') onRescue('ad')
    })
  }

  const handleSP = () => {
    if (!canSP) return
    onRescue('sp')
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

        {canAd && (
          <TouchableOpacity
            style={styles.adBtn}
            onPress={handleAd}
            activeOpacity={0.8}
            disabled={adLoading}
          >
            {adLoading
              ? <ActivityIndicator size="small" color={C.query} />
              : <Text style={styles.adBtnIcon}>📺</Text>
            }
            <View style={{ flex: 1 }}>
              <Text style={[styles.adBtnTitle, { fontFamily: MONO }]}>Reklam İzle</Text>
              <Text style={[styles.adBtnSub, { fontFamily: MONO }]}>Ücretsiz kurtarma</Text>
            </View>
            <Text style={[styles.adBtnArrow, { color: C.query }]}>›</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.spBtn, !canSP && styles.spBtnDisabled]}
          onPress={handleSP}
          activeOpacity={canSP ? 0.8 : 1}
          disabled={!canSP}
        >
          <Text style={styles.adBtnIcon}>💎</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.spBtnTitle, { fontFamily: MONO, color: canSP ? C.accept_glow : C.text_muted }]}>
              {spCost} SP Harca
            </Text>
            <Text style={[styles.adBtnSub, { fontFamily: MONO }]}>
              {canSP ? `Mevcut: ${progress.sp} SP` : `Yetersiz SP (${progress.sp}/${spCost})`}
            </Text>
          </View>
        </TouchableOpacity>

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
    padding: 24,
  },
  card: {
    width: '100%',
    backgroundColor: C.background,
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: C.danger + '66',
    padding: 24,
    alignItems: 'center',
    gap: 10,
  },
  warningIcon: { fontSize: 40, marginBottom: 4 },
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
    gap: 12,
    width: '100%',
    backgroundColor: C.query + '11',
    borderWidth: 1,
    borderColor: C.query + '44',
    borderRadius: R.md,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  adBtnIcon: { fontSize: 22 },
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
  adBtnArrow: { fontSize: 22, fontWeight: TY.weight_black },
  spBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    backgroundColor: C.accept + '11',
    borderWidth: 1,
    borderColor: C.accept + '44',
    borderRadius: R.md,
    paddingVertical: 14,
    paddingHorizontal: 16,
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
    marginTop: 6,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  giveUpText: {
    color: C.text_muted,
    fontSize: TY.size_xs,
    letterSpacing: 2,
    textDecorationLine: 'underline',
  },
})
