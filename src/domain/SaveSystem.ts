import AsyncStorage from '@react-native-async-storage/async-storage'

const KEYS = {
  GAME:      'lastgate_game',
  STATS:     'lastgate_stats',
  PROGRESS:  'lastgate_progress',
  NPC_QUEUE: 'lastgate_npc_queue',
  SETTINGS:  'lastgate_settings',
} as const

export type SaveError = { key: string; error: unknown }

export const SaveSystem = {
  async save(data: Record<string, unknown>): Promise<void> {
    const errors: SaveError[] = []

    await Promise.all(
      Object.entries(data).map(async ([key, value]) => {
        try {
          await AsyncStorage.setItem(key, JSON.stringify(value))
        } catch (e) {
          console.error('[SaveSystem] save failed for key:', key, e)
          errors.push({ key, error: e })
        }
      })
    )

    if (errors.length > 0) {
      throw new Error(`[SaveSystem] ${errors.length} key(s) failed to save: ${errors.map(e => e.key).join(', ')}`)
    }
  },

  async load<T>(key: string): Promise<T | null> {
    try {
      const raw = await AsyncStorage.getItem(key)
      if (!raw) return null
      const parsed: unknown = JSON.parse(raw)
      if (typeof parsed !== 'object' || parsed === null) {
        console.warn('[SaveSystem] unexpected load shape for key:', key)
        return null
      }
      return parsed as T
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
