import React, { useEffect } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming } from 'react-native-reanimated'
import { useTheme } from '../../hooks/useTheme'
import { StatType } from '../../types/stat.types'
import { useStatStore } from '../../store/useStatStore'
import uiData from '../../data/ui.json'
import themeData from '../../data/theme.json'
const TY = themeData.typography as any

const STAT_LABELS = uiData.critical_stat_labels as Record<StatType, string>

export const CriticalWarning: React.FC = () => {
  const theme = useTheme()
  const isCritical = useStatStore(s => s.isCritical)
  const opacity = useSharedValue(0)

  const criticals = (['immunity', 'food', 'population', 'defense', 'economy'] as StatType[])
    .filter(s => isCritical(s))

  useEffect(() => {
    if (criticals.length > 0) {
      opacity.value = withRepeat(
        withSequence(withTiming(1, { duration: 400 }), withTiming(0.2, { duration: 400 })),
        -1,
        true
      )
    } else {
      opacity.value = withTiming(0)
    }
  }, [criticals.length])

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }))

  if (criticals.length === 0) return null

  return (
    <Animated.View
      style={[
        styles.container,
        animStyle,
        { backgroundColor: theme.colors.warning_overlay },
      ]}
      pointerEvents="none"
    >
      {criticals.map(stat => (
        <Text
          key={stat}
          style={[
            styles.text,
            { color: theme.colors.stat_critical, fontSize: theme.typography.size_lg },
          ]}
        >
          ⚠ {STAT_LABELS[stat]}
        </Text>
      ))}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 40,
  },
  text: { fontWeight: TY.weight_black, textAlign: 'center', marginBottom: 4 },
})
