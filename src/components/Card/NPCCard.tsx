import React from 'react'
import { View, Text, Image, StyleSheet, useWindowDimensions } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { NPC } from '../../types/npc.types'
import ILLUSTRATIONS from '../../assets/images'
import themeData from '../../data/theme.json'

const C  = themeData.colors
const TY = themeData.typography as any
const SP = themeData.spacing
const R  = themeData.radius
const ROLE_COLORS = themeData.ui.role_colors as Record<string, string>
const ROLE_TR     = themeData.ui.role_names_tr as Record<string, string>

interface Props {
  npc: NPC
  availableHeight?: number
  hideDialogue?: boolean
}

const CARD_ASPECT  = 3 / 4
const CARD_PADDING = 8

const NPCCardInner: React.FC<Props> = ({ npc, availableHeight, hideDialogue }) => {
  const { width } = useWindowDimensions()
  const roleColor = ROLE_COLORS[npc.role] ?? C.text_muted

  const baseW = width * 0.84
  const baseH = baseW / CARD_ASPECT
  const maxH  = availableHeight ? availableHeight - CARD_PADDING * 2 : baseH
  const cardH = Math.min(baseH, maxH)
  const cardW = cardH * CARD_ASPECT

  const gradH = hideDialogue
    ? Math.max(64, Math.round(cardH * 0.22))
    : Math.max(130, Math.round(cardH * 0.40))

  return (
    <View style={[styles.card, {
      width: cardW, height: cardH, borderRadius: 18,
      borderWidth: 1.5, borderColor: roleColor + '55',
      shadowColor: '#000',
    }]}>

      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: roleColor + '1a' }]} />

      {ILLUSTRATIONS[npc.illustration_key] ? (
        <Image
          source={ILLUSTRATIONS[npc.illustration_key]}
          style={{ position: 'absolute', top: 0, left: 0, width: cardW, height: cardH }}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.placeholder}>
          <Text style={[styles.placeholderChar, { color: roleColor }]}>
            {npc.role[0]}
          </Text>
        </View>
      )}

      <LinearGradient
        colors={['rgba(0,0,0,0.50)', 'transparent']}
        style={styles.gradTop}
        pointerEvents="none"
      />

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.95)']}
        style={[styles.gradBottom, { height: gradH }]}
        pointerEvents="none"
      >
        <View style={styles.textBlock}>
          <Text style={styles.name} numberOfLines={1}>{npc.name}</Text>
          {!hideDialogue && (
            <Text style={styles.dialogue} numberOfLines={3}>"{npc.dialogue}"</Text>
          )}
        </View>
      </LinearGradient>

      <View style={[styles.roleBadge, { backgroundColor: roleColor + 'dd', shadowColor: roleColor }]}>
        <Text style={styles.roleText}>{ROLE_TR[npc.role] ?? npc.role.toUpperCase()}</Text>
      </View>

    </View>
  )
}

export const NPCCard = React.memo(NPCCardInner)

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.55,
    shadowRadius: 22,
    elevation: 16,
  },
  placeholder: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderChar: {
    fontSize: 100,
    fontWeight: TY.weight_black,
    opacity: 0.10,
  },
  gradTop: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 90,
  },
  gradBottom: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    justifyContent: 'flex-end',
  },
  textBlock: {
    paddingHorizontal: 16,
    paddingBottom: 18,
  },
  name: {
    color: C.text_primary,
    fontSize: TY.size_h5,
    fontWeight: TY.weight_heavy,
    letterSpacing: 0.2,
    marginBottom: 5,
    textShadowColor: 'rgba(0,0,0,0.95)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  dialogue: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: TY.size_sm,
    lineHeight: 18,
    fontStyle: 'italic',
    textShadowColor: 'rgba(0,0,0,0.95)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  roleBadge: {
    position: 'absolute',
    top: 12, left: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: R.sm,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4,
  },
  roleText: {
    color: C.text_primary,
    fontSize: TY.size_xs,
    fontWeight: TY.weight_heavy,
    letterSpacing: 1.8,
  },
})
