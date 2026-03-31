import { NPC } from '../types/npc.types'
import { StatDelta, StatType } from '../types/stat.types'
import { NPCReturn, PendingDelayed, FollowupData } from '../types/return.types'

export const ReturnSystem = {
  enqueueDelayed(npc: NPC, acceptedDay: number): PendingDelayed | null {
    const de = npc.delayed_effect
    if (!de) return null
    const { day, ...statFields } = de
    const effects: StatDelta = {}
    for (const [k, v] of Object.entries(statFields)) {
      effects[k as StatType] = v
    }
    return {
      npc_id: npc.npc_id,
      trigger_day: acceptedDay + day,
      effects,
      notification: '',
    }
  },

  tickDelayed(
    pending: PendingDelayed[],
    currentDay: number,
  ): { deltas: StatDelta[]; notifications: string[]; remaining: PendingDelayed[] } {
    const deltas: StatDelta[] = []
    const notifications: string[] = []
    const remaining: PendingDelayed[] = []
    for (const item of pending) {
      if (currentDay >= item.trigger_day) {
        deltas.push(item.effects)
        if (item.notification) notifications.push(item.notification)
      } else {
        remaining.push(item)
      }
    }
    return { deltas, notifications, remaining }
  },

  enqueueReturn(followup: FollowupData, npc: NPC, acceptedDay: number): NPCReturn {
    return {
      npc_id: npc.npc_id,
      npc_name: npc.name,
      npc_role: npc.role,
      trigger_day: acceptedDay + followup.delay_days,
      dialogue: followup.dialogue,
      accept_effects: followup.accept_effects,
      reject_effects: followup.reject_effects,
      outcome_accept: followup.outcome_accept,
      outcome_reject: followup.outcome_reject,
    }
  },

  tickReturns(
    pending: NPCReturn[],
    currentDay: number,
  ): { triggered: NPCReturn | null; remaining: NPCReturn[] } {
    const idx = pending.findIndex(r => currentDay >= r.trigger_day)
    if (idx === -1) return { triggered: null, remaining: pending }
    const triggered = pending[idx]
    const remaining = pending.filter((_, i) => i !== idx)
    return { triggered, remaining }
  },
}
