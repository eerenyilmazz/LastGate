import { NPC } from '../types/npc.types'
import rawScenarios from '../data/scenarios.json'

const ALL_NPCS: NPC[] = (rawScenarios as any).scenarios as NPC[]

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export class NPCGenerator {
  private queue: NPC[]
  private usedIDs: Set<string>

  constructor() {
    this.usedIDs = new Set()
    this.queue = shuffle(ALL_NPCS)
  }

  getNext(): NPC {
    if (this.queue.length === 0) {
      // Tüm NPC'ler tükendiyse yeniden karıştır
      this.queue = shuffle(ALL_NPCS)
      this.usedIDs.clear()
    }
    const npc = this.queue.pop()!
    this.usedIDs.add(npc.npc_id)
    return npc
  }

  reset(): void {
    this.usedIDs = new Set()
    this.queue = shuffle(ALL_NPCS)
  }

  // Serialization için
  getState(): { queue: NPC[]; usedIDs: string[] } {
    return { queue: this.queue, usedIDs: Array.from(this.usedIDs) }
  }

  loadState(state: { queue: NPC[]; usedIDs: string[] }): void {
    this.queue = state.queue
    this.usedIDs = new Set(state.usedIDs)
  }
}
