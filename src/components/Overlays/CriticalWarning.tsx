import React, { useEffect } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming } from 'react-native-reanimated'
import { useTheme } from '../../hooks/useTheme'
import { StatType } from '../../types/stat.types'
import { useStatStore } from '../../store/useStatStore'
import uiData from '../../data/ui.json'
import themeData from '../../data/theme.json'
const TY = themeData.typography as any
const C  = themeData.colors

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
        withSequence(withTiming(1, { duration: themeData.animation.critical_pulse_ms }), withTiming(0.3, { duration: themeData.animation.critical_pulse_ms })),
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
    <Animated.View style={[styles.container, animStyle]} pointerEvents="none">
      <View style={styles.banner}>
        {criticals.map(stat => (
          <Text
            key={stat}
            style={[styles.text, { color: theme.colors.stat_critical }]}
          >
            ⚠ {STAT_LABELS[stat]}
          </Text>
        ))}
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  banner: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: C.critical_banner_bg,
    borderTopWidth: 1,
    borderTopColor: C.critical_banner_bdr,
  },
  text: {
    fontWeight: TY.weight_black,
    fontSize: 11,
    letterSpacing: 0.5,
  },
})
