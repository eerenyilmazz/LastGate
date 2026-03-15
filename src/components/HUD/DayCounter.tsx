import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useTheme } from '../../hooks/useTheme'
import config from '../../data/config.json'

interface Props {
  day: number
}

export const DayCounter: React.FC<Props> = ({ day }) => {
  const theme = useTheme()

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.colors.text_secondary }]}>GÜN</Text>
      <Text style={[styles.day, { color: theme.colors.text_primary }]}>{day}</Text>
      <Text style={[styles.label, { color: theme.colors.text_secondary }]}>/ {config.win_condition_day}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  label:     { fontSize: 11, letterSpacing: 1 },
  day:       { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
})
