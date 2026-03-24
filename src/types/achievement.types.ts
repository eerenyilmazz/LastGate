export type AchievementId =
  | 'survivor_10'
  | 'survivor_50'
  | 'first_win'
  | 'iron_gate'
  | 'builder'
  | 'ten_runs'
  | 'veteran'
  | 'interrogator'
  | 'healer_synergy'
  | 'fortress'
  | 'clean_gate'
  | 'three_wins'

export interface Achievement {
  id: AchievementId
  title: string
  desc: string
  icon: string
}

export interface AchievementCheckInput {
  day:        number
  difficulty: string
  runStats:   { accepted: number; rejected: number; queries: number }
  buildings:  string[]
  roleCounts: Record<string, number>
  isVictory:  boolean
}

export const ACHIEVEMENT_DEFS: Achievement[] = [
  { id: 'survivor_10',    title: 'İlk Adım',         desc: '10. güne ulaş.',                             icon: '🗓' },
  { id: 'survivor_50',    title: 'Direnişçi',         desc: '50. güne ulaş.',                             icon: '🔥' },
  { id: 'first_win',      title: 'Son Savunma',       desc: '100 günü hayatta geçir.',                    icon: '🏆' },
  { id: 'iron_gate',      title: 'Demir Kapı',        desc: 'Zor modda kazan.',                           icon: '⚔️' },
  { id: 'builder',        title: 'Mimar',             desc: 'Aynı runda 5 bina inşa et.',                 icon: '🏗' },
  { id: 'ten_runs',       title: 'Deneyimli',         desc: '10 run tamamla.',                            icon: '🔁' },
  { id: 'veteran',        title: 'Efsane Kapıcı',     desc: '25 run tamamla.',                            icon: '🎖' },
  { id: 'interrogator',   title: 'Dedektif',          desc: 'Tek runda 15 veya daha fazla sorgulama yap.',icon: '🔍' },
  { id: 'healer_synergy', title: 'Sağlık Ağı',        desc: 'Doktor sinerjisini aktif et.',               icon: '💊' },
  { id: 'fortress',       title: 'Kale',              desc: 'Asker sinerjisini aktif et.',                icon: '🛡' },
  { id: 'clean_gate',     title: 'Temiz Sicil',       desc: 'Bir runda 20+ NPC kabul et.',                icon: '✅' },
  { id: 'three_wins',     title: 'Üç Kez Zafer',      desc: '3 kez galibiyete ulaş.',                     icon: '🥇' },
]

export function evaluateAchievements(
  input: AchievementCheckInput,
  alreadyUnlocked: AchievementId[],
  totalRuns: number,
  totalWins: number,
): AchievementId[] {
  const newUnlocks: AchievementId[] = []

  const check = (id: AchievementId, condition: boolean) => {
    if (condition && !alreadyUnlocked.includes(id)) newUnlocks.push(id)
  }

  check('survivor_10',    input.day >= 10)
  check('survivor_50',    input.day >= 50)
  check('first_win',      input.isVictory)
  check('iron_gate',      input.isVictory && input.difficulty === 'hard')
  check('three_wins',     totalWins >= 3)
  check('ten_runs',       totalRuns >= 10)
  check('veteran',        totalRuns >= 25)
  check('interrogator',   input.runStats.queries >= 15)
  check('healer_synergy', (input.roleCounts['doctor'] ?? 0) >= 3)
  check('fortress',       (input.roleCounts['soldier'] ?? 0) >= 2)
  check('clean_gate',     input.runStats.accepted >= 20)
  check('builder', (() => {
    const ownedBuildings = input.buildings.filter(id => !id.startsWith('skill_'))
    return ownedBuildings.length >= 5
  })())

  return newUnlocks
}
