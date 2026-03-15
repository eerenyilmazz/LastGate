import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native'
import { useTheme } from '../hooks/useTheme'
import { useStatStore } from '../store/useStatStore'
import { useProgressStore } from '../store/useProgressStore'
import { useGameStore } from '../store/useGameStore'
import { StatType } from '../types/stat.types'
import { AppBar } from '../components/AppBar'
import config from '../data/config.json'
import themeData from '../data/theme.json'

const UI        = themeData.ui
const STAT_KEYS = UI.stat_keys as StatType[]

interface Props {
  onRestart?: () => void
  onMainMenu?: () => void
}

export const SummaryScreen: React.FC<Props> = ({ onRestart, onMainMenu }) => {
  const theme    = useTheme()
  const stats    = useStatStore()
  const progress = useProgressStore()
  const game     = useGameStore()

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <AppBar />
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Başlık */}
        <Text style={[styles.eyebrow, { color: theme.colors.accept_glow }]}>
          HAYATTAKİ SON
        </Text>

        <Text style={styles.trophy}>🏆</Text>

        <Text style={[styles.title, { color: theme.colors.text_primary }]}>
          {game.day}. Gün
        </Text>

        <Text style={[styles.sub, { color: theme.colors.text_secondary }]}>
          {config.win_condition_day} günü geride bıraktın.{'\n'}
          Kapılar hâlâ ayakta. Şehir yaşıyor.
        </Text>

        {/* Final istatistikler */}
        <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.cardLabel, { color: theme.colors.text_secondary }]}>
            FİNAL DURUMU
          </Text>
          {STAT_KEYS.map(key => (
            <View key={key} style={styles.statRow}>
              <Text style={styles.statIcon}>{(UI.stat_icons as any)[key]}</Text>
              <Text style={[styles.statName, { color: theme.colors.text_secondary }]}>
                {(UI.stat_names_tr as any)[key]}
              </Text>
              <Text style={[styles.statVal, { color: theme.colors.text_primary }]}>
                {Math.round(stats.stats[key])}
              </Text>
            </View>
          ))}
        </View>

        {/* SP */}
        <View style={[styles.spCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.spLabel, { color: theme.colors.text_secondary }]}>
            Toplam SP
          </Text>
          <View style={styles.spRight}>
            <Text style={[styles.spStar, { color: theme.colors.query }]}>★</Text>
            <Text style={[styles.spNum, { color: theme.colors.query }]}>{progress.sp}</Text>
          </View>
        </View>

        {/* Butonlar */}
        <View style={styles.btnGroup}>
          <TouchableOpacity
            onPress={onRestart}
            style={[styles.btn, { backgroundColor: theme.colors.accept }]}
          >
            <Text style={styles.btnText}>⟳  Tekrar Oyna</Text>
          </TouchableOpacity>

          {onMainMenu && (
            <TouchableOpacity
              onPress={onMainMenu}
              style={[styles.btn, styles.btnSecondary]}
            >
              <Text style={[styles.btnText, { color: '#999' }]}>↩  Ana Menü</Text>
            </TouchableOpacity>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:    { flex: 1 },
  scroll:  { padding: 24, paddingTop: 40 },

  eyebrow: { fontSize: 11, letterSpacing: 4, textAlign: 'center', marginBottom: 16 },
  trophy:  { fontSize: 52, textAlign: 'center', marginBottom: 8 },
  title:   { fontSize: 34, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  sub:     { fontSize: 15, lineHeight: 24, textAlign: 'center', marginBottom: 28 },

  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  cardLabel: { fontSize: 11, letterSpacing: 2, marginBottom: 12 },
  statRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  statIcon:  { fontSize: 18, width: 26, textAlign: 'center' },
  statName:  { flex: 1, fontSize: 14 },
  statVal:   { fontSize: 16, fontWeight: '700' },

  spCard: {
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
  },
  spLabel: { fontSize: 15 },
  spRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  spStar:  { fontSize: 16 },
  spNum:   { fontSize: 24, fontWeight: '800' },

  btnGroup:    { gap: 10 },
  btn:         { borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  btnSecondary: { backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#2a2a2a' },
  btnText:     { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 1 },
})
