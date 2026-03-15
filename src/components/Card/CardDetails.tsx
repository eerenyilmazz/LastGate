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

// ─── Sabit tablolar ─────────────────────────────────────────────────────────

const ROLE_COLORS = themeData.ui.role_colors as Record<string, string>
const ROLE_TR     = themeData.ui.role_names_tr as Record<string, string>
const STAT_ICONS  = themeData.ui.stat_icons as Record<string, string>
const STAT_NAMES  = themeData.ui.stat_names_tr as Record<string, string>
const MONO        = Platform.select(themeData.ui.font_mono) as string
const DOTS        = themeData.ui.terminal_dots

// ─── DeltaChips: stat değişimlerini renkli chip olarak göster ───────────────

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

// ─── Bölüm başlığı ──────────────────────────────────────────────────────────

const SectionLabel: React.FC<{ text: string; color?: string }> = ({ text, color = '#333' }) => (
  <View style={ds.sectionRow}>
    <View style={[ds.sectionLine, { backgroundColor: color }]} />
    <Text style={[ds.sectionText, { color, fontFamily: MONO }]}>{text}</Text>
    <View style={[ds.sectionLine, { backgroundColor: color }]} />
  </View>
)

// ─── Ana bileşen ─────────────────────────────────────────────────────────────

interface Props {
  npc: NPC
  visible: boolean
  onClose: () => void
}

export const CardDetails: React.FC<Props> = ({ npc, visible, onClose }) => {
  const roleColor = ROLE_COLORS[npc.role] ?? '#555'

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

          {/* ── Terminal başlık çubuğu ── */}
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

            {/* ── Kimlik bloğu ── */}
            <View style={ds.idBlock}>
              {/* Sol: renkli çizgi */}
              <View style={[ds.idAccent, { backgroundColor: roleColor }]} />

              <View style={ds.idContent}>
                {/* Rol rozeti */}
                <View style={[ds.roleBadge, { backgroundColor: roleColor + '22', borderColor: roleColor + '55' }]}>
                  <Text style={[ds.roleText, { color: roleColor, fontFamily: MONO }]}>
                    {ROLE_TR[npc.role] ?? npc.role.toUpperCase()}
                  </Text>
                </View>

                {/* İsim */}
                <Text style={ds.name}>{npc.name}</Text>

                {/* Diyalog */}
                <Text style={ds.dialogue}>"{npc.dialogue}"</Text>
              </View>
            </View>

            {/* ── Gözlem ── */}
            <SectionLabel text={LABELS.card_observe} color="#444" />
            <View style={ds.observeBlock}>
              <Text style={[ds.observeText, { fontFamily: MONO }]}>{npc.clue_text}</Text>
            </View>

            {/* ── Kabul etkisi ── */}
            <SectionLabel text={LABELS.card_accept} color={C.accept} />
            <View style={ds.effectBlock}>
              <DeltaChips delta={npc.accept as StatDelta} />
            </View>

            {/* ── Ret etkisi ── */}
            <SectionLabel text={LABELS.card_reject} color={C.reject} />
            <View style={ds.effectBlock}>
              <DeltaChips delta={npc.reject as StatDelta} />
            </View>

            <View style={{ height: 8 }} />
          </ScrollView>

          {/* ── Kapat butonu ── */}
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

// ─── Stiller ─────────────────────────────────────────────────────────────────

const ds = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.82)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#0c0906',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderTopWidth: 1,
    borderColor: '#1e1510',
    maxHeight: '80%',
    paddingBottom: Platform.OS === 'android' ? 28 : 20,
  },

  // Terminal başlık
  termHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#110d09',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1c1510',
  },
  dots: { flexDirection: 'row', gap: 5 },
  dot:  { width: 8, height: 8, borderRadius: 4 },
  termTitle: {
    flex: 1,
    color: '#2a2a2a',
    fontSize: 9,
    letterSpacing: 2,
    fontWeight: '700',
    textAlign: 'center',
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  closeText: { color: '#555', fontSize: 11, fontWeight: '900' },

  // Scrollview içi
  body: { paddingHorizontal: 16, paddingTop: 14, gap: 0 },

  // Kimlik bloğu
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
    color: '#eee',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  dialogue: {
    color: '#555',
    fontSize: 12,
    lineHeight: 18,
    fontStyle: 'italic',
  },

  // Bölüm başlığı
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

  // Gözlem
  observeBlock: {
    backgroundColor: '#110d09',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e1810',
    padding: 12,
    marginBottom: 4,
  },
  observeText: {
    color: '#888',
    fontSize: 12,
    lineHeight: 19,
  },

  // Stat etkileri
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
  chipName: { color: '#555', fontSize: 10, fontWeight: '600' },
  chipVal:  { fontSize: 12, fontWeight: '800' },
  deltaEmpty: { color: '#2a2a2a', fontSize: 12, fontStyle: 'italic' },

  // Kapat butonu
  closeButton: {
    marginHorizontal: 16,
    marginTop: 14,
    paddingVertical: 13,
    borderRadius: 8,
    backgroundColor: '#140f0b',
    borderWidth: 1,
    borderColor: '#231912',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#3a3a3a',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
  },
})
