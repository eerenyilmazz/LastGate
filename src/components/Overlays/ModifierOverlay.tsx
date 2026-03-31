import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useGameStore } from '../../store/useGameStore'
import themeData from '../../data/theme.json'

const C  = themeData.colors
const TY = themeData.typography as any
const SP = themeData.spacing
const UI = themeData.ui as any

interface Props {
  onContinue: () => void
}

export const ModifierOverlay: React.FC<Props> = ({ onContinue }) => {
  const mod = useGameStore(s => s.activeModifier)
  if (!mod) return null

  return (
    <View style={styles.backdrop}>
      <View style={styles.card}>
        <Text style={styles.label}>BU RUN'UN KURALI</Text>
        <Text style={styles.icon}>{mod.icon}</Text>
        <Text style={styles.name}>{mod.name}</Text>
        <Text style={styles.description}>{mod.description}</Text>
        <TouchableOpacity style={styles.btn} onPress={onContinue} activeOpacity={0.8}>
          <Text style={styles.btnText}>ANLADIM</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
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
    width: '80%',
    backgroundColor: C.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.query + '66',
    padding: SP.lg,
    alignItems: 'center',
    gap: SP.sm,
  },
  label: {
    color: C.text_muted,
    fontSize: TY.size_xs,
    letterSpacing: 2,
    fontWeight: TY.weight_bold,
  },
  icon: {
    fontSize: 64,
    marginVertical: SP.sm,
  },
  name: {
    color: C.query,
    fontSize: TY.size_xl,
    fontWeight: TY.weight_bold,
    textAlign: 'center',
  },
  description: {
    color: C.text_secondary,
    fontSize: TY.size_md,
    textAlign: 'center',
    lineHeight: 22,
    marginVertical: SP.sm,
  },
  btn: {
    marginTop: SP.sm,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.query,
    borderRadius: 8,
    paddingVertical: SP.sm,
    paddingHorizontal: SP.xl,
  },
  btnText: {
    color: C.query,
    fontSize: TY.size_sm,
    fontWeight: TY.weight_bold,
    letterSpacing: 2,
  },
})
