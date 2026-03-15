import React, { useEffect } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSequence, withSpring } from 'react-native-reanimated'
import { useTheme } from '../../hooks/useTheme'
import { StatType } from '../../types/stat.types'
import themeData from '../../data/theme.json'
import config from '../../data/config.json'

const STAT_ICONS = themeData.ui.stat_icons as Record<StatType, string>
const STAT_MAX   = config.stat_max as Record<StatType, number>

interface Props {
  stat: StatType
  value: number
  isCritical: boolean
}

export const StatBar: React.FC<Props> = ({ stat, value, isCritical }) => {
  const theme = useTheme()
  const percent = Math.min(1, Math.max(0, value / STAT_MAX[stat]))
  const animWidth = useSharedValue(percent)
  const shake = useSharedValue(0)

  const statColor = isCritical
    ? theme.colors.stat_critical
    : theme.colors[`stat_${stat}` as keyof typeof theme.colors] as string

  useEffect(() => {
    animWidth.value = withTiming(percent, { duration: theme.animation.stat_bar_duration_ms })
    if (isCritical) {
      shake.value = withSequence(
        withSpring(-4), withSpring(4), withSpring(-3),
        withSpring(3), withSpring(0)
      )
    }
  }, [percent, isCritical])

  const barStyle = useAnimatedStyle(() => ({
    width: `${animWidth.value * 100}%`,
    backgroundColor: statColor,
  }))

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shake.value }],
  }))

  return (
    <Animated.View style={[styles.row, containerStyle]}>
      <Text style={[styles.icon, { color: isCritical ? theme.colors.stat_critical : statColor }]}>
        {STAT_ICONS[stat]}
      </Text>

      <View style={[styles.track, {
        height: theme.stat_bar.height,
        borderRadius: theme.stat_bar.border_radius,
        backgroundColor: theme.colors.surface,
      }]}>
        <Animated.View style={[styles.fill, barStyle, {
          height: theme.stat_bar.height,
          borderRadius: theme.stat_bar.border_radius,
        }]} />
      </View>

      <Text style={[styles.value, {
        color: isCritical ? theme.colors.stat_critical : theme.colors.text_secondary,
        fontSize: theme.typography.size_sm,
      }]}>
        {Math.round(value)}
      </Text>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  icon:  { width: 22, fontSize: 13, textAlign: 'center', marginRight: 6 },
  track: { flex: 1, marginRight: 6 },
  fill:  {},
  value: { width: 28, textAlign: 'right', fontWeight: '600' },
})
