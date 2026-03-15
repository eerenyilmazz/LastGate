import React, { useState } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useProgressStore } from '../store/useProgressStore'
import { useStatStore } from '../store/useStatStore'
import { useGameStore } from '../store/useGameStore'
import { BuildingConfig } from '../types/config.types'
import { StatDelta } from '../types/stat.types'
import { AppBar } from '../components/AppBar'
import config from '../data/config.json'
import themeData from '../data/theme.json'
import uiData from '../data/ui.json'

const L = uiData.labels

const MONO = Platform.select(themeData.ui.font_mono) as string

const SKILL_DEFS = config.skills as Array<{
  id: string; icon: string; color: string; label: string;
  cost: number; unlock_day: number; desc: string; chips: string[];
  effect: StatDelta;
}>

type Tab = 'buildings' | 'skills'

interface Props {
  onMainMenu?: () => void
}

const Chip: React.FC<{ label: string; color: string }> = ({ label, color }) => (
  <View style={[ch.wrap, { backgroundColor: color + '18', borderColor: color + '44' }]}>
    <Text style={[ch.text, { color: color + 'cc', fontFamily: MONO }]}>{label}</Text>
  </View>
)

export const BuildingScreen: React.FC<Props> = ({ onMainMenu }) => {
  const progress = useProgressStore()
  const stats    = useStatStore()
  const game     = useGameStore()
  const [tab, setTab] = useState<Tab>('buildings')
  const buildings = config.buildings as Array<BuildingConfig & { icon: string; color: string; chips: string[] }>

  const goBack = () => game.setPhase('day_summary')

  return (
    <SafeAreaView style={styles.safe}>

      <AppBar onMainMenu={onMainMenu} />

      <View style={[styles.header, { paddingTop: Platform.OS === 'android' ? 10 : 2 }]}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn} activeOpacity={0.75}>
          <Text style={styles.backArrow}>←</Text>
          <Text style={[styles.backLabel, { fontFamily: MONO }]}>{L.screen_back}</Text>
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { fontFamily: MONO }]}>{L.screen_building_title}</Text>

        <View style={styles.spBadge}>
          <Text style={[styles.spStar, { fontFamily: MONO }]}>★</Text>
          <Text style={[styles.spNum, { fontFamily: MONO }]}>{progress.sp}</Text>
        </View>
      </View>

      <View style={styles.tabBar}>
        {(['buildings', 'skills'] as Tab[]).map(t => (
          <TouchableOpacity
            key={t}
            onPress={() => setTab(t)}
            style={[styles.tabBtn, tab === t && styles.tabActive]}
            activeOpacity={0.75}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive, { fontFamily: MONO }]}>
              {t === 'buildings'
                ? `${L.tab_buildings}  (${progress.buildings.filter(id => !id.startsWith('skill_')).length}/${buildings.length})`
                : `${L.tab_skills}  (${SKILL_DEFS.filter(s => progress.hasBuilding(s.id)).length}/${SKILL_DEFS.length})`
              }
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      >

        {tab === 'buildings' && buildings.map(b => {
          const owned     = progress.hasBuilding(b.id)
          const locked    = game.day < b.unlock_day
          const canBuy    = !owned && !locked && progress.sp >= b.cost
          const notEnough = !owned && !locked && progress.sp < b.cost
          const accentClr = owned ? '#1b5e20' : locked ? '#222' : b.color

          return (
            <View key={b.id} style={[
              styles.card,
              { borderLeftColor: accentClr },
              locked && styles.cardLocked,
              owned  && styles.cardOwned,
            ]}>
              <View style={styles.cardRow}>
                <View style={[styles.iconBox, { backgroundColor: b.color + '18', borderColor: b.color + '33' }]}>
                  <Text style={styles.iconText}>{b.icon}</Text>
                </View>

                <View style={styles.cardBody}>
                  <View style={styles.labelRow}>
                    <Text style={[styles.cardLabel, { fontFamily: MONO }]}>{b.label.toUpperCase()}</Text>
                    {!locked && (
                      <View style={[styles.dayTag, { borderColor: b.color + '33' }]}>
                        <Text style={[styles.dayTagText, { color: b.color + '99', fontFamily: MONO }]}>
                          {L.building_day_prefix} {b.unlock_day}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.cardDesc}>{b.description}</Text>
                </View>

                <View style={styles.statusCol}>
                  {owned ? (
                    <View style={styles.ownedBox}>
                      <Text style={[styles.ownedText, { fontFamily: MONO }]}>{L.building_active}</Text>
                    </View>
                  ) : locked ? (
                    <View style={styles.lockedBox}>
                      <Text style={[styles.lockedDayLabel, { fontFamily: MONO }]}>{L.building_day_prefix}</Text>
                      <Text style={[styles.lockedDayNum, { color: b.color + '99', fontFamily: MONO }]}>{b.unlock_day}</Text>
                    </View>
                  ) : (
                    <View style={[styles.costBox, { borderColor: b.color + '55' }]}>
                      <Text style={[styles.costStar, { color: b.color }]}>★</Text>
                      <Text style={[styles.costNum, { color: notEnough ? '#2a2a2a' : b.color, fontFamily: MONO }]}>{b.cost}</Text>
                    </View>
                  )}
                </View>
              </View>

              {!locked && (
                <View style={styles.chipRow}>
                  {b.chips.map((c: string, i: number) => (
                    <Chip key={i} label={c} color={owned ? '#1b5e20' : b.color} />
                  ))}
                </View>
              )}

              {canBuy && (
                <TouchableOpacity
                  onPress={() => progress.buyBuilding(b.id)}
                  style={[styles.actionBtn, { backgroundColor: b.color + '22', borderColor: b.color + '66' }]}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.actionBtnText, { color: b.color, fontFamily: MONO }]}>{L.building_build}</Text>
                </TouchableOpacity>
              )}

              {notEnough && (
                <Text style={[styles.insuffText, { fontFamily: MONO }]}>
                  {b.cost - progress.sp}{L.building_sp_needed_suffix}
                </Text>
              )}
            </View>
          )
        })}

        {tab === 'skills' && SKILL_DEFS.map(skill => {
          const used      = progress.hasBuilding(skill.id)
          const locked    = game.day < skill.unlock_day
          const canBuy    = !used && !locked && progress.sp >= skill.cost
          const notEnough = !used && !locked && progress.sp < skill.cost
          const accentClr = used ? '#283593' : locked ? '#222' : skill.color

          const handleBuy = () => {
            if (!canBuy) return
            if (!progress.spendSP(skill.cost)) return
            progress.markUsed(skill.id)
            stats.apply(skill.effect)
          }

          return (
            <View key={skill.id} style={[
              styles.card,
              { borderLeftColor: accentClr },
              locked && styles.cardLocked,
              used   && styles.cardUsed,
            ]}>
              <View style={styles.cardRow}>
                <View style={[styles.iconBox, { backgroundColor: skill.color + '18', borderColor: skill.color + '33' }]}>
                  <Text style={styles.iconText}>{skill.icon}</Text>
                </View>

                <View style={styles.cardBody}>
                  <View style={styles.labelRow}>
                    <Text style={[styles.cardLabel, { fontFamily: MONO }]}>{skill.label.toUpperCase()}</Text>
                    {!locked && !used && (
                      <View style={[styles.dayTag, { borderColor: skill.color + '33' }]}>
                        <Text style={[styles.dayTagText, { color: skill.color + '99', fontFamily: MONO }]}>
                          {L.building_day_prefix} {skill.unlock_day}
                        </Text>
                      </View>
                    )}
                    {!locked && !used && (
                      <View style={styles.onceBadge}>
                        <Text style={[styles.onceText, { fontFamily: MONO }]}>{L.building_once}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.cardDesc}>{skill.desc}</Text>
                </View>

                <View style={styles.statusCol}>
                  {used ? (
                    <View style={[styles.ownedBox, { backgroundColor: '#090914', borderColor: '#28348855' }]}>
                      <Text style={[styles.ownedText, { color: '#5c6bc0', fontFamily: MONO }]}>{L.building_used}</Text>
                    </View>
                  ) : locked ? (
                    <View style={styles.lockedBox}>
                      <Text style={[styles.lockedDayLabel, { fontFamily: MONO }]}>{L.building_day_prefix}</Text>
                      <Text style={[styles.lockedDayNum, { color: skill.color + '99', fontFamily: MONO }]}>{skill.unlock_day}</Text>
                    </View>
                  ) : (
                    <View style={[styles.costBox, { borderColor: skill.color + '55' }]}>
                      <Text style={[styles.costStar, { color: skill.color }]}>★</Text>
                      <Text style={[styles.costNum, { color: notEnough ? '#2a2a2a' : skill.color, fontFamily: MONO }]}>{skill.cost}</Text>
                    </View>
                  )}
                </View>
              </View>

              {!locked && (
                <View style={styles.chipRow}>
                  {skill.chips.map((c, i) => (
                    <Chip key={i} label={c} color={used ? '#283593' : skill.color} />
                  ))}
                </View>
              )}

              {canBuy && (
                <TouchableOpacity
                  onPress={handleBuy}
                  style={[styles.actionBtn, { backgroundColor: skill.color + '22', borderColor: skill.color + '66' }]}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.actionBtnText, { color: skill.color, fontFamily: MONO }]}>{L.building_use}</Text>
                </TouchableOpacity>
              )}

              {notEnough && (
                <Text style={[styles.insuffText, { fontFamily: MONO }]}>
                  {skill.cost - progress.sp}{L.building_sp_needed_suffix}
                </Text>
              )}
            </View>
          )
        })}

        <View style={{ height: Platform.OS === 'android' ? 64 : 32 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0c0906' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    gap: 12, borderBottomWidth: 1, borderBottomColor: '#1a1410',
  },
  backBtn:     { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: '#1a1410', borderWidth: 1, borderColor: '#261e14' },
  backArrow:   { color: '#888', fontSize: 16, lineHeight: 18 },
  backLabel:   { color: '#888', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  headerTitle: { flex: 1, color: '#eee', fontSize: 13, fontWeight: '800', letterSpacing: 3, textAlign: 'center' },
  spBadge:     { flexDirection: 'row', alignItems: 'center', gap: 2 },
  spStar:      { color: '#f57c00', fontSize: 15 },
  spNum:       { color: '#f0f0f0', fontSize: 16, fontWeight: '900' },

  tabBar:        { flexDirection: 'row', marginHorizontal: 16, marginVertical: 10, borderRadius: 8, backgroundColor: '#120e0a', padding: 3, gap: 3, borderWidth: 1, borderColor: '#1c1510' },
  tabBtn:        { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 6 },
  tabActive:     { backgroundColor: '#1e1812', borderWidth: 1, borderColor: '#2a1e14' },
  tabText:       { color: '#2a2a2a', fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  tabTextActive: { color: '#aaa' },

  list: { paddingHorizontal: 16, paddingTop: 4, gap: 10 },

  card: {
    backgroundColor: '#100e0b',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e1a14',
    borderLeftWidth: 3,
    gap: 10,
  },
  cardOwned:  { backgroundColor: '#090f09', borderColor: '#101e10' },
  cardUsed:   { backgroundColor: '#09090f', borderColor: '#10101e' },
  cardLocked: { opacity: 0.35 },

  cardRow:  { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  iconBox:  { width: 46, height: 46, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  iconText: { fontSize: 22 },
  cardBody: { flex: 1, gap: 4 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap' },
  cardLabel:{ color: '#d0d0d0', fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  cardDesc: { color: '#3a3a3a', fontSize: 11, lineHeight: 16 },

  dayTag:     { paddingHorizontal: 5, paddingVertical: 2, borderRadius: 3, borderWidth: 1, backgroundColor: 'transparent' },
  dayTagText: { fontSize: 8, fontWeight: '700', letterSpacing: 0.5 },

  statusCol: { alignItems: 'center', justifyContent: 'center' },

  ownedBox:      { backgroundColor: '#081208', borderWidth: 1, borderColor: '#1b5e2066', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 3 },
  ownedText:     { color: '#2e7d32', fontSize: 8, fontWeight: '800', letterSpacing: 0.5 },
  lockedBox:     { alignItems: 'center', gap: 0 },
  lockedDayLabel:{ color: '#222', fontSize: 7, fontWeight: '700', letterSpacing: 1 },
  lockedDayNum:  { fontSize: 20, fontWeight: '900' },
  costBox:       { borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 5, alignItems: 'center', gap: 1 },
  costStar:      { fontSize: 11 },
  costNum:       { fontSize: 15, fontWeight: '900' },

  onceBadge: { backgroundColor: '#1e1812', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2, borderWidth: 1, borderColor: '#2a1e14' },
  onceText:  { color: '#2e2e2e', fontSize: 8, fontWeight: '700', letterSpacing: 0.5 },

  chipRow:        { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  actionBtn:      { borderRadius: 7, paddingVertical: 11, alignItems: 'center', borderWidth: 1, marginTop: 2 },
  actionBtnText:  { fontSize: 11, fontWeight: '800', letterSpacing: 2 },
  insuffText:     { color: '#2a2a2a', fontSize: 10, textAlign: 'center', letterSpacing: 0.5 },
})

const ch = StyleSheet.create({
  wrap: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 5, borderWidth: 1 },
  text: { fontSize: 10, fontWeight: '700' },
})
