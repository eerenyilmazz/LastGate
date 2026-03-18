import AsyncStorage from '@react-native-async-storage/async-storage'

const KEYS = {
  GAME:     'lastgate_game',
  STATS:    'lastgate_stats',
  PROGRESS: 'lastgate_progress',
  NPC_QUEUE:'lastgate_npc_queue',
  SETTINGS: 'lastgate_settings',
} as const

export const SaveSystem = {
  async save(data: Record<string, unknown>): Promise<void> {
    try {
      await Promise.all(
        Object.entries(data).map(([key, value]) =>
          AsyncStorage.setItem(key, JSON.stringify(value))
        )
      )
    } catch (e) {
      console.error('[SaveSystem] save failed:', e)
    }
  },

  async load<T>(key: string): Promise<T | null> {
    try {
      const raw = await AsyncStorage.getItem(key)
      return raw ? (JSON.parse(raw) as T) : null
    } catch (e) {
      console.error('[SaveSystem] load failed for key:', key, e)
      return null
    }
  },

  async clear(): Promise<void> {
    await Promise.all(Object.values(KEYS).map(key => AsyncStorage.removeItem(key)))
  },

  KEYS,
}
