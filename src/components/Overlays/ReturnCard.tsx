import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native'
import { NPCReturn } from '../../types/return.types'
import themeData from '../../data/theme.json'

const C        = themeData.colors
const TY       = themeData.typography as any
const SP       = themeData.spacing
const UI       = themeData.ui as any
const ROLE_CLR = themeData.ui.role_colors as Record<string, string>
const ROLE_TR  = themeData.ui.role_names_tr as Record<string, string>
const MONO     = Platform.select(themeData.ui.font_mono) as string

interface Props {
  ret: NPCReturn
  onChoice: (choice: 'accept' | 'reject') => void
}

export const ReturnCard: React.FC<Props> = ({ ret, onChoice }) => {
  const roleColor = ROLE_CLR[ret.npc_role] ?? C.text_secondary
  const roleTr    = ROLE_TR[ret.npc_role] ?? ret.npc_role

  return (
    <View style={styles.backdrop}>
      <View style={styles.card}>
        <Text style={[styles.returnLabel, { fontFamily: MONO }]}>KARAR ANI</Text>

        <View style={[styles.roleBadge, { borderColor: roleColor }]}>
          <Text style={[styles.roleText, { color: roleColor, fontFamily: MONO }]}>
            {roleTr.toUpperCase()}
          </Text>
        </View>

        <Text style={[styles.name, { color: roleColor }]}>{ret.npc_name}</Text>

        <Text style={[styles.dialogue, { fontFamily: MONO }]}>{ret.dialogue}</Text>

        <View style={styles.btnRow}>
          <TouchableOpacity
            style={[styles.btn, styles.btnReject]}
            onPress={() => onChoice('reject')}
            activeOpacity={0.8}
          >
            <Text style={[styles.btnText, { fontFamily: MONO, color: C.reject_glow }]}>RET</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, styles.btnAccept]}
            onPress={() => onChoice('accept')}
            activeOpacity={0.8}
          >
            <Text style={[styles.btnText, { fontFamily: MONO, color: C.accept_glow }]}>KABUL</Text>
          </TouchableOpacity>
        </View>
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
    width: '85%',
    backgroundColor: C.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.divider,
    padding: SP.lg,
    alignItems: 'center',
    gap: SP.sm,
  },
  returnLabel: {
    color: C.text_muted,
    fontSize: TY.size_caption,
    letterSpacing: 2.5,
    fontWeight: TY.weight_black,
    marginBottom: SP.xs,
  },
  roleBadge: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: SP.sm,
    paddingVertical: 3,
  },
  roleText: {
    fontSize: TY.size_caption,
    letterSpacing: 2,
    fontWeight: TY.weight_black,
  },
  name: {
    fontSize: TY.size_lg,
    fontWeight: TY.weight_black,
    textAlign: 'center',
    marginTop: SP.xs,
  },
  dialogue: {
    color: C.text_secondary,
    fontSize: TY.size_sm,
    lineHeight: 20,
    textAlign: 'center',
    marginVertical: SP.sm,
    fontStyle: 'italic',
  },
  btnRow: {
    flexDirection: 'row',
    gap: SP.sm,
    marginTop: SP.sm,
    width: '100%',
  },
  btn: {
    flex: 1,
    paddingVertical: SP.sm,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  btnAccept: {
    borderColor: C.accept_glow,
    backgroundColor: C.accept + '18',
  },
  btnReject: {
    borderColor: C.reject_glow,
    backgroundColor: (C as any).danger + '18',
  },
  btnText: {
    fontSize: TY.size_sm,
    fontWeight: TY.weight_black,
    letterSpacing: 1.5,
  },
})
