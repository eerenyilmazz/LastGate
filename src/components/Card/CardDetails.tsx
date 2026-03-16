import React from 'react'
import {
  View, Text, TouchableOpacity, Modal, ScrollView,
  StyleSheet, Platform,
} from 'react-native'
import { NPC } from '../../types/npc.types'
import { StatDelta } from '../../types/stat.types'
import themeData from '../../data/theme.json'
import uiData from '../../data/ui.json'

const C      = themeData.colors
const LABELS = uiData.labels

const ROLE_COLORS = themeData.ui.role_colors as Record<string, string>
const ROLE_TR     = themeData.ui.role_names_tr as Record<string, string>
const STAT_ICONS  = themeData.ui.stat_icons as Record<string, string>
const STAT_NAMES  = themeData.ui.stat_names_tr as Record<string, string>
const MONO        = Platform.select(themeData.ui.font_mono) as string
const DOTS        = themeData.ui.terminal_dots

const DeltaChips: React.FC<{ delta: StatDelta }> = ({ delta }) => {
  const entries = Object.entries(delta).filter(([, v]) => v !== undefined && v !== 0)
  if (entries.length === 0) {
    return <Text style={ds.deltaEmpty}>—</Text>
  }
  return (
    <View style={ds.chipRow}>
      {entries.map(([stat, val]) => {
        const positive = (val ?? 0) > 0
        return (
          <View
            key={stat}
            style={[ds.chip, { borderColor: positive ? C.accept + '55' : C.reject + '55', backgroundColor: positive ? C.diff_pos_bg : C.diff_neg_bg }]}
          >
            <Text style={ds.chipIcon}>{STAT_ICONS[stat]}</Text>
            <Text style={ds.chipName}>{STAT_NAMES[stat]}</Text>
            <Text style={[ds.chipVal, { color: positive ? C.accept_glow : C.reject_glow }]}>
              {positive ? '+' : ''}{val}
            </Text>
          </View>
        )
      })}
    </View>
  )
}

const SectionLabel: React.FC<{ text: string; color?: string }> = ({ text, color = C.text_muted }) => (
  <View style={ds.sectionRow}>
    <View style={[ds.sectionLine, { backgroundColor: color }]} />
    <Text style={[ds.sectionText, { color, fontFamily: MONO }]}>{text}</Text>
    <View style={[ds.sectionLine, { backgroundColor: color }]} />
  </View>
)

interface Props {
  npc: NPC
  visible: boolean
  onClose: () => void
}

export const CardDetails: React.FC<Props> = ({ npc, visible, onClose }) => {
  const roleColor = ROLE_COLORS[npc.role] ?? C.text_muted

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={ds.backdrop}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={ds.sheet} onStartShouldSetResponder={() => true}>

          <View style={ds.termHeader}>
            <View style={ds.dots}>
              <View style={[ds.dot, { backgroundColor: DOTS[0] }]} />
              <View style={[ds.dot, { backgroundColor: DOTS[1] }]} />
              <View style={[ds.dot, { backgroundColor: DOTS[2] }]} />
            </View>
            <Text style={[ds.termTitle, { fontFamily: MONO }]}>
              DOSYA · {npc.npc_id.toUpperCase().slice(0, 8)}
            </Text>
            <TouchableOpacity onPress={onClose} style={ds.closeBtn} activeOpacity={0.75}>
              <Text style={ds.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={ds.body}
          >

            <View style={ds.idBlock}>
              <View style={[ds.idAccent, { backgroundColor: roleColor }]} />

              <View style={ds.idContent}>
                <View style={[ds.roleBadge, { backgroundColor: roleColor + '22', borderColor: roleColor + '55' }]}>
                  <Text style={[ds.roleText, { color: roleColor, fontFamily: MONO }]}>
                    {ROLE_TR[npc.role] ?? npc.role.toUpperCase()}
                  </Text>
                </View>

                <Text style={ds.name}>{npc.name}</Text>

                <Text style={ds.dialogue}>"{npc.dialogue}"</Text>
              </View>
            </View>

            <SectionLabel text={LABELS.card_observe} color="#444" />
            <View style={ds.observeBlock}>
              <Text style={[ds.observeText, { fontFamily: MONO }]}>{npc.clue_text}</Text>
            </View>

            <SectionLabel text={LABELS.card_accept} color={C.accept} />
            <View style={ds.effectBlock}>
              <DeltaChips delta={npc.accept as StatDelta} />
            </View>

            <SectionLabel text={LABELS.card_reject} color={C.reject} />
            <View style={ds.effectBlock}>
              <DeltaChips delta={npc.reject as StatDelta} />
            </View>

            <View style={{ height: 8 }} />
          </ScrollView>

          <TouchableOpacity
            onPress={onClose}
            style={ds.closeButton}
            activeOpacity={0.8}
          >
            <Text style={[ds.closeButtonText, { fontFamily: MONO }]}>{LABELS.card_close}</Text>
          </TouchableOpacity>

        </View>
      </TouchableOpacity>
    </Modal>
  )
}

const ds = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.82)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: C.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderTopWidth: 1,
    borderColor: C.card_bg,
    maxHeight: '80%',
    paddingBottom: Platform.OS === 'android' ? 28 : 20,
  },

  termHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: C.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.card_bg,
  },
  dots: { flexDirection: 'row', gap: 5 },
  dot:  { width: 8, height: 8, borderRadius: 4 },
  termTitle: {
    flex: 1,
    color: C.divider,
    fontSize: 9,
    letterSpacing: 2,
    fontWeight: '700',
    textAlign: 'center',
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: C.card_bg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.divider,
  },
  closeText: { color: C.text_muted, fontSize: 11, fontWeight: '900' },

  body: { paddingHorizontal: 16, paddingTop: 14, gap: 0 },

  idBlock: {
    flexDirection: 'row',
    marginBottom: 18,
  },
  idAccent: {
    width: 3,
    borderRadius: 2,
    marginRight: 12,
  },
  idContent: { flex: 1, gap: 6 },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
  },
  roleText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  name: {
    color: C.text_primary,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  dialogue: {
    color: C.text_muted,
    fontSize: 12,
    lineHeight: 18,
    fontStyle: 'italic',
  },

  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 10,
  },
  sectionLine: { flex: 1, height: 1 },
  sectionText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2,
  },

  observeBlock: {
    backgroundColor: C.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.divider,
    padding: 12,
    marginBottom: 4,
  },
  observeText: {
    color: C.text_muted,
    fontSize: 12,
    lineHeight: 19,
  },

  effectBlock: {
    marginBottom: 4,
    minHeight: 32,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
  },
  chipIcon: { fontSize: 12 },
  chipName: { color: C.text_muted, fontSize: 10, fontWeight: '600' },
  chipVal:  { fontSize: 12, fontWeight: '800' },
  deltaEmpty: { color: C.divider, fontSize: 12, fontStyle: 'italic' },

  closeButton: {
    marginHorizontal: 16,
    marginTop: 14,
    paddingVertical: 13,
    borderRadius: 8,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.divider,
    alignItems: 'center',
  },
  closeButtonText: {
    color: C.text_muted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
  },
})
