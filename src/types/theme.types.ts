export interface ThemeColors {
  background: string
  surface: string
  card_bg: string
  accept: string
  accept_glow: string
  reject: string
  reject_glow: string
  query: string
  text_primary: string
  text_secondary: string
  stat_immunity: string
  stat_food: string
  stat_population: string
  stat_defense: string
  stat_economy: string
  stat_critical: string
  warning_overlay: string
  day_summary_bg: string
  button_primary: string
  button_border: string
  overlay_bg: string
  divider: string
  diff_pos_bg: string
  diff_neg_bg: string
  bg_deeper: string
  card_dark: string
  text_muted: string
  text_bright: string
  danger: string
  danger_dark: string
  border_pos: string
  border_neg: string
  border_warn: string
  border_info: string
  info: string
}

export interface ThemeTypography {
  size_2xs:      number
  size_caption:  number
  size_xs:       number
  size_note:     number
  size_sm:       number
  size_body:     number
  size_md:       number
  size_h6:       number
  size_h5:       number
  size_h4:       number
  size_lg:       number
  size_xl:       number
  size_xxl:      number
  size_h7:       number
  size_h6_alt:   number
  size_xl_alt:   number
  size_banner:   number
  size_display:  number
  size_hero:     number
  weight_regular:  string
  weight_semi:     string
  weight_bold:     string
  weight_heavy:    string
  weight_black:    string
  font_family: string
}

export interface ThemeSpacing {
  xxs: number
  xs:  number
  sm:  number
  md:  number
  lg:  number
  xl:  number
}

export interface ThemeRadius {
  xs:   number
  sm:   number
  md:   number
  pill: number
  lg:   number
  xl:   number
  xxl:  number
}

export interface ThemeCard {
  width_ratio: number
  height_ratio: number
  border_radius: number
  shadow_opacity: number
}

export interface ThemeAnimation {
  swipe_duration_ms: number
  stat_bar_duration_ms: number
  overlay_fade_ms: number
  card_enter_ms: number
  swipe_threshold: number
}

export interface ThemeStatBar {
  height: number
  border_radius: number
  label_width: number
}

export interface ThemeUIStatMap {
  [key: string]: string
  immunity: string; food: string; population: string; defense: string; economy: string
}

export interface ThemeUIRoleMap {
  [key: string]: string
  Doctor: string; Farmer: string; Soldier: string; Trader: string; Engineer: string; Scavenger: string
}

export interface ThemeUI {
  stat_keys: string[]
  stat_icons: ThemeUIStatMap
  stat_names_tr: ThemeUIStatMap
  stat_names_upper: ThemeUIStatMap
  stat_abbrevs: ThemeUIStatMap
  stat_colors: ThemeUIStatMap
  role_colors: ThemeUIRoleMap
  role_names_tr: ThemeUIRoleMap
  choice_colors: { A: string; B: string; C: string }
  terminal_dots: string[]
  font_mono: { ios: string; android: string }
}

export interface Theme {
  colors: ThemeColors
  typography: ThemeTypography
  spacing: ThemeSpacing
  radius: ThemeRadius
  card: ThemeCard
  animation: ThemeAnimation
  stat_bar: ThemeStatBar
  ui: ThemeUI
}
