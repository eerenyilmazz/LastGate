import { Theme } from '../types/theme.types'
import themeData from '../data/theme.json'

export const useTheme = (): Theme => themeData as Theme
