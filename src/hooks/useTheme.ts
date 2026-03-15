import { Theme } from '../types/theme.types'
import themeData from '../data/theme.json'

// Tek kaynak — theme.json. Bileşenler hiçbir zaman renk veya boyut yazmaz.
export const useTheme = (): Theme => themeData as Theme
