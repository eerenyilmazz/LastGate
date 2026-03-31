export interface ModifierEffect {
  start_stat_delta?: Partial<Record<string, number>>
  food_consumption_mult?: number
  role_mult?: Record<string, number>
  npc_neg_scale_mult?: number
  npcs_per_day_fixed?: number
  query_free?: boolean
}

export interface RunModifier {
  id: string
  name: string
  description: string
  icon: string
  effects: ModifierEffect
}
