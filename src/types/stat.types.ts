export type StatType = 'immunity' | 'food' | 'population' | 'defense' | 'economy'

export type StatDelta = Partial<Record<StatType, number>>

export interface StatState {
  immunity: number
  food: number
  population: number
  defense: number
  economy: number
}
