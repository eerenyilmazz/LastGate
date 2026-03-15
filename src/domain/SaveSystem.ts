import AsyncStorage from '@react-native-async-storage/async-storage'

const KEYS = {
  GAME:     'lastgate_game',
  STATS:    'lastgate_stats',
  PROGRESS: 'lastgate_progress',
  NPC_QUEUE:'lastgate_npc_queue',
} as const

export const SaveSystem = {
  async save(data: Record<string, unknown>): Promise<void> {
    for (const [key, value] of Object.entries(data)) {
      await AsyncStorage.setItem(key, JSON.stringify(value))
    }
  },

  async load<T>(key: string): Promise<T | null> {
    try {
      const raw = await AsyncStorage.getItem(key)
      return raw ? (JSON.parse(raw) as T) : null
    } catch {
      return null
    }
  },

  async clear(): Promise<void> {
    for (const key of Object.values(KEYS)) {
      await AsyncStorage.removeItem(key)
    }
  },

  KEYS,
}
