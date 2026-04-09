import { useCallback, useRef } from 'react'
import { useSettingsStore } from '../store/useSettingsStore'
import { useProgressStore } from '../store/useProgressStore'
import config from '../data/config.json'

const AD_UNIT_ID = (config as any).admob_android_rewarded as string

const AD_LIMITS = config.ad_limits as Record<string, number>
const AD_SP_MULT = config.ad_sp_multipliers as Record<string, number>
const AD_REWARD = config.ad_reward_amount

let RewardedAd: any = null
let RewardedAdEventType: any = null
let TestIds: any = null
try {
  const mod = require('react-native-google-mobile-ads')
  RewardedAd = mod.RewardedAd
  RewardedAdEventType = mod.RewardedAdEventType
  TestIds = mod.TestIds
} catch {}

const isAvailable = RewardedAd !== null

export const useRewardedAd = () => {
  const settings = useSettingsStore()
  const progress = useProgressStore()

  const adRef     = useRef<any>(null)
  const loadedRef = useRef(false)

  const getAdUnitId = () => {
    if (__DEV__ && TestIds) return TestIds.REWARDED
    return AD_UNIT_ID
  }

  const load = useCallback(() => {
    if (!isAvailable) return
    try {
      const ad = RewardedAd.createForAdRequest(getAdUnitId(), {
        requestNonPersonalizedAdsOnly: true,
      })
      adRef.current = ad
      loadedRef.current = false
      const unsubLoad = ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
        loadedRef.current = true
      })
      ad.load()
      return () => { try { unsubLoad() } catch {} }
    } catch {}
  }, [])

  const canShow = useCallback((difficulty: string): boolean => {
    if (!isAvailable) return false
    const limit = AD_LIMITS[difficulty] ?? 4
    return progress.adsWatchedThisRun < limit
  }, [progress.adsWatchedThisRun])

  const spReward = useCallback((difficulty: string): number => {
    const mult = AD_SP_MULT[difficulty] ?? 1
    return Math.round(AD_REWARD * mult)
  }, [])

  const show = useCallback((onResult: (result: 'earned' | 'dismissed' | 'unavailable') => void) => {
    if (!isAvailable || !adRef.current || !loadedRef.current) {
      onResult('unavailable')
      return
    }
    try {
      const unsubs: (() => void)[] = []
      const cleanup = () => unsubs.forEach(fn => { try { fn() } catch {} })

      unsubs.push(adRef.current.addAdEventListener(
        RewardedAdEventType.EARNED_REWARD, () => {
          cleanup()
          progress.incrementAdsWatched()
          onResult('earned')
          setTimeout(load, 500)
        }
      ))
      unsubs.push(adRef.current.addAdEventListener(
        RewardedAdEventType.CLOSED, () => {
          cleanup()
          onResult('dismissed')
        }
      ))
      adRef.current.show()
      loadedRef.current = false
    } catch {
      onResult('unavailable')
    }
  }, [load, progress])

  return { load, show, canShow, spReward, isAvailable }
}
