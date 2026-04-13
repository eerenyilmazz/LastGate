import { HiddenTrait } from '../types/npc.types'
import { StatDelta, StatState, StatType } from '../types/stat.types'
import { TraitHandler } from './TraitHandler'
import config from '../data/config.json'
import ui from '../data/ui.json'

export interface PendingTrait {
  npc_id: string
  npc_name: string
  npc_role: string
  trait: HiddenTrait
  accepted_day: number
}

interface TickModifiers {
  infectionReduction?: number
  difficulty?: string
}

const EXPIRY = config.trait_expiry_days
const NOTIF  = ui.hidden_notifications
const DIFF_SCALE = (config as any).trait_difficulty_scale as Record<string, number>

export const HiddenSystem = {
  enqueue(pending: PendingTrait[], npc_id: string, npc_name: string, npc_role: string, trait: HiddenTrait, currentDay: number): PendingTrait[] {
    if (trait === 'none' || trait === 'liar') return pending
    return [...pending, { npc_id, npc_name, npc_role, trait, accepted_day: currentDay }]
  },

  tick(
    pending: PendingTrait[],
    state: StatState,
    currentDay: number,
    modifiers: TickModifiers = {},
  ): { deltas: StatDelta[]; notifications: string[]; remaining: PendingTrait[] } {
    const deltas: StatDelta[] = []
    const notifications: string[] = []
    const remaining: PendingTrait[] = []
    const reduction = Math.min(modifiers.infectionReduction ?? 0, config.infection_reduction_cap)
    const diffScale = DIFF_SCALE[modifiers.difficulty ?? 'normal'] ?? 1.0

    for (const item of pending) {
      const daysSince = currentDay - item.accepted_day
      let delta = TraitHandler.getEffect(item.trait, state, daysSince)

      if (delta && item.trait === 'infected' && reduction > 0) {
        const scaled: StatDelta = {}
        for (const [k, v] of Object.entries(delta)) {
          if (v !== undefined) {
            scaled[k as StatType] = v < 0 ? Math.ceil(v * (1 - reduction)) : v
          }
        }
        delta = scaled
      }

      if (delta) {
        const scaledDelta: StatDelta = {}
        for (const [k, v] of Object.entries(delta)) {
          if (v !== undefined) {
            scaledDelta[k as StatType] = v < 0
              ? Math.floor(v * diffScale)
              : Math.ceil(v * diffScale)
          }
        }
        deltas.push(scaledDelta)
        notifications.push(HiddenSystem.getNotificationText(item.trait, daysSince, item.npc_role))
      }

      if (item.trait === 'spy'       && daysSince >= EXPIRY.spy)       continue
      if (item.trait === 'thief'     && daysSince >= EXPIRY.thief)     continue
      if (item.trait === 'protector' && daysSince >= EXPIRY.protector) continue
      remaining.push(item)
    }

    return { deltas, notifications, remaining }
  },

  getRoleTR(role: string): string {
    const map: Record<string, string> = {
      Doctor: 'Doktor', Farmer: 'Çiftçi', Soldier: 'Asker',
      Trader: 'Tüccar', Engineer: 'Mühendis', Scavenger: 'Kaşif',
    }
    return map[role] ?? role
  },

  getNotificationText(trait: HiddenTrait, days: number, npcRole: string): string {
    const r = HiddenSystem.getRoleTR(npcRole)
    if (trait === 'infected' && days === 1) return `warning|Kabul ettiğin ${r} hasta. Bağışıklık düşüyor.`
    if (trait === 'infected' && days === 2) return `warning|${r}dan gelen hastalık yayılmaya başladı.`
    if (trait === 'infected' && days === 3) return `danger|${r}dan gelen hastalık şehre yayıldı.`
    if (trait === 'infected' && days === 5) return `danger|SALGIN! Kabul ettiğin ${r} karantinaya alınamadı.`
    if (trait === 'infected' && days > 5)   return `danger|Salgın kontrol altına alınamıyor. Kaynak: ${r}.`
    if (trait === 'spy')                    return `danger|Kabul ettiğin ${r} ajan çıktı. Savunma sistemleri hasar gördü.`
    if (trait === 'thief' && days === 2)    return `warning|${r} geceleri depolardan çalıyor.`
    if (trait === 'thief')                  return `danger|${r} büyük miktarda kaynak çalıp kayboldu.`
    return ''
  },
}
