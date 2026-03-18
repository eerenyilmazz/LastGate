import { useEffect, useRef, useCallback } from 'react'
import { Audio } from 'expo-av'
import { useStatStore } from '../store/useStatStore'
import { useGameStore } from '../store/useGameStore'
import { useSettingsStore } from '../store/useSettingsStore'

const AUDIO_PATHS: Record<string, any> = {
  ambient_normal:  require('../assets/audio/ambient/ambient_normal.mp3'),
  ambient_danger:  require('../assets/audio/ambient/ambient_danger.mp3'),
  ambient_victory: require('../assets/audio/ambient/ambient_victory.mp3'),
  sfx_query:       require('../assets/audio/sfx/sfx_query.mp3'),
  sfx_critical:    require('../assets/audio/sfx/sfx_critical.mp3'),
  sfx_door_open:   require('../assets/audio/sfx/sfx_door_open.mp3'),
  sfx_door_close:  require('../assets/audio/sfx/sfx_door_close.mp3'),
}

import config from '../data/config.json'

const AMBIENT_VOLUME = config.audio_volumes.ambient
const SFX_VOLUME     = config.audio_volumes.sfx
const SFX_VOLUMES    = (config as any).sfx_volumes as Record<string, number>

export const useAudio = () => {
  const bgSound        = useRef<Audio.Sound | null>(null)
  const currentKey     = useRef<string>('')
  const started        = useRef(false)
  const sfxSounds      = useRef<Audio.Sound[]>([])

  const stats          = useStatStore(s => s.stats)
  const isCritical     = useStatStore(s => s.isCritical)
  const isGameOver     = useGameStore(s => s.isGameOver)
  const gameOverReason = useGameStore(s => s.gameOverReason)
  const musicEnabled   = useSettingsStore(s => s.musicEnabled)
  const sfxEnabled     = useSettingsStore(s => s.sfxEnabled)

  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    }).catch(() => {})
  }, [])

  const loadBg = useCallback(async (key: string) => {
    if (!started.current) return
    if (currentKey.current === key) return
    const src = AUDIO_PATHS[key]
    if (!src) return
    try {
      if (bgSound.current) {
        await bgSound.current.stopAsync()
        await bgSound.current.unloadAsync()
        bgSound.current = null
      }
      currentKey.current = key
      const { sound } = await Audio.Sound.createAsync(src, {
        isLooping: true,
        volume: musicEnabled ? AMBIENT_VOLUME : 0,
      })
      bgSound.current = sound
      if (musicEnabled) await sound.playAsync()
    } catch (e) {
      console.warn('[useAudio] loadBg error:', e)
    }
  }, [musicEnabled])

  const startAmbient = useCallback(async () => {
    started.current = true
    await loadBg('ambient_normal')
  }, [loadBg])

  const playSFX = useCallback(async (key: string) => {
    if (!sfxEnabled) return
    const src = AUDIO_PATHS[key]
    if (!src) return
    try {
      const volume = SFX_VOLUMES[key] ?? SFX_VOLUME
      const { sound } = await Audio.Sound.createAsync(src, { volume })
      sfxSounds.current.push(sound)
      await sound.playAsync()
      sound.setOnPlaybackStatusUpdate(status => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync()
          sfxSounds.current = sfxSounds.current.filter(s => s !== sound)
        }
      })
    } catch (e) {
      console.warn('[useAudio] playSFX error:', e)
    }
  }, [sfxEnabled])

  const stopAllSFX = useCallback(async () => {
    const toStop = [...sfxSounds.current]
    sfxSounds.current = []
    for (const s of toStop) {
      try { await s.stopAsync(); await s.unloadAsync() } catch {}
    }
  }, [])

  useEffect(() => {
    if (!bgSound.current) return
    if (musicEnabled) {
      bgSound.current.setVolumeAsync(AMBIENT_VOLUME).catch(() => {})
      bgSound.current.playAsync().catch(() => {})
    } else {
      bgSound.current.setVolumeAsync(0).catch(() => {})
      bgSound.current.pauseAsync().catch(() => {})
    }
  }, [musicEnabled])

  useEffect(() => {
    if (!isGameOver) return
    if (gameOverReason === 'victory') {
      loadBg('ambient_victory')
    } else {
      bgSound.current?.stopAsync().catch(() => {})
      bgSound.current?.unloadAsync().catch(() => {})
      bgSound.current = null
      currentKey.current = ''
    }
  }, [isGameOver])

  useEffect(() => {
    if (isGameOver || !started.current) return
    const anyCritical =
      isCritical('immunity') || isCritical('food') ||
      isCritical('defense')  || isCritical('economy')
    loadBg(anyCritical ? 'ambient_danger' : 'ambient_normal')
  }, [stats.immunity, stats.food, stats.defense, stats.economy])

  useEffect(() => {
    return () => { bgSound.current?.unloadAsync() }
  }, [])

  return { playSFX, stopAllSFX, startAmbient }
}
