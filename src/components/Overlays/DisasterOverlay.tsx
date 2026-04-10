import React, { useEffect, useRef } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native'
import { Disaster } from '../../types/game.types'
import themeData from '../../data/theme.json'

const C  = themeData.colors
const TY = themeData.typography as any
const SP = themeData.spacing
const UI = themeData.ui as any

interface Props {
  disaster: Disaster
  onContinue: () => void
}

export const DisasterOverlay: React.FC<Props> = ({ disaster, onContinue }) => {
  const shake = useRef(new Animated.Value(0)).current
  const fade  = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.sequence([
      Animated.timing(fade, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.sequence([
        Animated.timing(shake, { toValue: 10,  duration: 60, useNativeDriver: true }),
        Animated.timing(shake, { toValue: -10, duration: 60, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 8,   duration: 50, useNativeDriver: true }),
        Animated.timing(shake, { toValue: -8,  duration: 50, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 0,   duration: 40, useNativeDriver: true }),
      ]),
    ]).start()
  }, [])

  const effectEntries = Object.entries(disaster.effects)

  return (
    <Animated.View style={[styles.backdrop, { opacity: fade }]}>
      <Animated.View style={[styles.card, { transform: [{ translateX: shake }] }]}>
        <Text style={styles.label}>FELAKET</Text>
        <Text style={styles.icon}>{disaster.icon}</Text>
        <Text style={styles.title}>{disaster.title}</Text>
        <Text style={styles.description}>{disaster.description}</Text>

        <View style={styles.effectsRow}>
          {effectEntries.map(([stat, val]) => (
            <View key={stat} style={styles.effectChip}>
              <Text style={styles.effectStat}>{STAT_ICONS[stat] ?? stat}</Text>
              <Text style={styles.effectVal}>{val > 0 ? `+${val}` : val}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.btn} onPress={onContinue} activeOpacity={0.8}>
          <Text style={styles.btnText}>ANLADIM</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  )
}

const STAT_ICONS: Record<string, string> = {
  immunity: '🛡',
  food: '🌾',
  population: '👥',
  defense: '⚔️',
  economy: '💰',
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: C.overlay_backdrop_dark,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: UI.overlay_z_index,
  },
  card: {
    width: '82%',
    backgroundColor: C.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.danger + '99',
    padding: SP.lg,
    alignItems: 'center',
    gap: SP.sm,
  },
  label: {
    color: C.danger,
    fontSize: TY.size_xs,
    letterSpacing: 3,
    fontWeight: TY.weight_black,
  },
  icon: {
    fontSize: 60,
    marginVertical: SP.xs,
  },
  title: {
    color: C.text_primary,
    fontSize: TY.size_xl,
    fontWeight: TY.weight_black,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  description: {
    color: C.text_secondary,
    fontSize: TY.size_sm,
    textAlign: 'center',
    lineHeight: 20,
    marginVertical: SP.xs,
  },
  effectsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginVertical: SP.xs,
  },
  effectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: C.danger + '22',
    borderWidth: 1,
    borderColor: C.danger + '55',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  effectStat: { fontSize: TY.size_md },
  effectVal:  {
    color: C.danger,
    fontSize: TY.size_sm,
    fontWeight: TY.weight_black,
  },
  btn: {
    marginTop: SP.sm,
    backgroundColor: C.danger + '22',
    borderWidth: 1,
    borderColor: C.danger,
    borderRadius: 8,
    paddingVertical: SP.sm,
    paddingHorizontal: SP.xl,
  },
  btnText: {
    color: C.danger,
    fontSize: TY.size_sm,
    fontWeight: TY.weight_black,
    letterSpacing: 2,
  },
})
