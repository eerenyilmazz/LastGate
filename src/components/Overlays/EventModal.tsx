import React from 'react'
import {
  View, Text, TouchableOpacity, Modal, ScrollView,
  StyleSheet, Platform,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { GameEvent, EventChoice } from '../../types/event.types'
import { NPCRole } from '../../types/npc.types'
import themeData from '../../data/theme.json'
import uiData from '../../data/ui.json'
import { ms } from '../../utils/scale'
const STRINGS = (uiData as any).strings as Record<string, string>

const C  = themeData.colors
const TY = themeData.typography as any
const SP = themeData.spacing
const R  = themeData.radius
const MONO        = Platform.select(themeData.ui.font_mono) as string
const STAT_ICONS  = themeData.ui.stat_icons as Record<string, string>
const CHOICE_COLOR = themeData.ui.choice_colors as Record<string, string>
const DOTS        = themeData.ui.terminal_dots

function mergeDeltas(
  a: Record<string, number | undefined>,
  b: Record<string, number | undefined>,
): Record<string, number> {
  const out: Record<string, number> = {}
  for (const [k, v] of Object.entries(a)) if (v !== undefined) out[k] = v
  for (const [k, v] of Object.entries(b)) {
    if (v !== undefined) out[k] = (out[k] ?? 0) + v
  }
  return out
}

const EffectChips: React.FC<{ effects: Record<string, number | undefined> }> = ({ effects }) => {
  const entries = Object.entries(effects).filter(([, v]) => v !== undefined && v !== 0)
  if (entries.length === 0) return <Text style={es.none}>—</Text>
  return (
    <View style={es.chipRow}>
      {entries.map(([stat, val]) => {
        const pos = (val ?? 0) > 0
        return (
          <View
            key={stat}
            style={[es.chip, {
              borderColor: pos ? (C.accept + '55') : (C.reject + '55'),
              backgroundColor: pos ? C.diff_pos_bg : C.diff_neg_bg,
            }]}
          >
            <Text style={es.chipIcon}>{STAT_ICONS[stat] ?? stat}</Text>
            <Text style={[es.chipVal, { color: pos ? C.accept_glow : C.reject_glow }]}>
              {pos ? '+' : ''}{val}
            </Text>
          </View>
        )
      })}
    </View>
  )
}

const ChoiceRow: React.FC<{
  choice: EventChoice
  hasBonus: boolean
  onPress: () => void
}> = ({ choice, hasBonus, onPress }) => {
  const color = CHOICE_COLOR[choice.id] ?? C.text_muted

  const combined: Record<string, number | undefined> =
    hasBonus && choice.role_bonus
      ? mergeDeltas(
          choice.effects as Record<string, number | undefined>,
          choice.role_bonus as Record<string, number | undefined>,
        )
      : (choice.effects as Record<string, number | undefined>)

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[es.choiceBtn, {
        borderLeftColor: color,
        borderColor: color + '22',
        backgroundColor: color + '08',
      }]}
      activeOpacity={0.82}
    >
      <View style={es.choiceTop}>
        <View style={[es.badge, { backgroundColor: color + '22', borderColor: color + '55' }]}>
          <Text style={[es.badgeLetter, { color, fontFamily: MONO }]}>{choice.id}</Text>
        </View>

        <Text style={es.choiceLabel} numberOfLines={2}>
          {choice.label}
        </Text>

        {hasBonus && choice.requires_role && (
          <View style={es.bonusBadge}>
            <Text style={[es.bonusText, { fontFamily: MONO }]}>★ BONUS</Text>
          </View>
        )}
      </View>

      <View style={es.chipArea}>
        <EffectChips effects={combined} />
      </View>
    </TouchableOpacity>
  )
}

interface Props {
  event: GameEvent
  acceptedRoles: NPCRole[]
  onChoice: (id: 'A' | 'B' | 'C') => void
}

export const EventModal: React.FC<Props> = ({ event, acceptedRoles, onChoice }) => {
  const insets = useSafeAreaInsets()
  const hasRoleBonus = (requires_role: NPCRole | null) =>
    !!requires_role && acceptedRoles.includes(requires_role)

  return (
    <Modal transparent animationType="slide" visible>
      <View style={es.backdrop}>
        <View style={[es.sheet, { paddingBottom: insets.bottom + 16 }]}>

          <View style={es.termHeader}>
            <View style={es.dots}>
              <View style={[es.dot, { backgroundColor: DOTS[0] }]} />
              <View style={[es.dot, { backgroundColor: DOTS[1] }]} />
              <View style={[es.dot, { backgroundColor: DOTS[2] }]} />
            </View>
            <Text style={[es.termTitle, { fontFamily: MONO }]}>
              OLAY · {event.category.toUpperCase()}
            </Text>
            <View style={{ width: ms(36) }} />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={es.body}
          >

            <Text style={es.eventTitle}>{event.title}</Text>

            <View style={es.descBlock}>
              <Text style={[es.descText, { fontFamily: MONO }]}>
                {event.description}
              </Text>
            </View>

            <View style={es.divider}>
              <View style={es.dividerLine} />
              <Text style={[es.dividerText, { fontFamily: MONO }]}>{STRINGS.event_choose}</Text>
              <View style={es.dividerLine} />
            </View>

            <View style={es.choicesBlock}>
              {event.choices.map(choice => (
                <ChoiceRow
                  key={choice.id}
                  choice={choice}
                  hasBonus={hasRoleBonus(choice.requires_role)}
                  onPress={() => onChoice(choice.id)}
                />
              ))}
            </View>

          </ScrollView>

        </View>
      </View>
    </Modal>
  )
}

const es = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: C.overlay_backdrop_dark,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: C.card_dark,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderColor: C.divider,
    maxHeight: '88%',
    paddingBottom: 0,
  },

  termHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(8),
    paddingHorizontal: ms(16),
    paddingVertical: ms(13),
    backgroundColor: C.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomWidth: 1,
    borderBottomColor: C.divider,
  },
  dots: { flexDirection: 'row', gap: ms(5) },
  dot:  { width: ms(8), height: ms(8), borderRadius: R.xs },
  termTitle: {
    flex: 1,
    color: C.text_secondary,
    fontSize: TY.size_caption,
    letterSpacing: 2,
    fontWeight: TY.weight_bold,
    textAlign: 'center',
  },

  body: {
    paddingHorizontal: ms(16),
    paddingTop: ms(16),
    paddingBottom: ms(8),
    gap: ms(12),
  },

  eventTitle: {
    color: C.text_primary,
    fontSize: TY.size_h5,
    fontWeight: TY.weight_heavy,
    letterSpacing: 0.3,
    textShadowColor: C.text_shadow_soft,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  descBlock: {
    backgroundColor: C.surface,
    borderRadius: R.pill,
    borderWidth: 1,
    borderColor: C.divider,
    borderLeftWidth: 3,
    borderLeftColor: C.divider,
    padding: ms(12),
  },
  descText: {
    color: C.text_secondary,
    fontSize: TY.size_sm,
    lineHeight: 20,
  },

  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(8),
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: C.divider },
  dividerText: {
    color: C.text_muted,
    fontSize: TY.size_caption,
    fontWeight: TY.weight_bold,
    letterSpacing: 1.5,
  },

  choicesBlock: { gap: ms(8) },

  choiceBtn: {
    borderRadius: R.pill,
    borderWidth: 1,
    borderLeftWidth: 4,
    padding: ms(12),
    gap: ms(8),
  },

  choiceTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(10),
  },

  badge: {
    width: ms(26),
    height: ms(26),
    borderRadius: R.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  badgeLetter: {
    fontSize: TY.size_sm,
    fontWeight: TY.weight_black,
  },

  choiceLabel: {
    flex: 1,
    color: C.text_bright,
    fontSize: TY.size_body,
    fontWeight: TY.weight_semi,
    lineHeight: 18,
  },

  bonusBadge: {
    backgroundColor: C.card_dark,
    borderRadius: R.xs,
    borderWidth: 1,
    borderColor: (C.query + '44'),
    paddingHorizontal: ms(5),
    paddingVertical: ms(2),
    flexShrink: 0,
  },
  bonusText: {
    color: C.query,
    fontSize: TY.size_2xs,
    fontWeight: TY.weight_heavy,
    letterSpacing: 0.5,
  },

  chipArea: { paddingLeft: ms(36) },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: ms(5) },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(3),
    paddingHorizontal: ms(7),
    paddingVertical: ms(4),
    borderRadius: R.xs,
    borderWidth: 1,
  },
  chipIcon: { fontSize: TY.size_note },
  chipVal:  { fontSize: TY.size_note, fontWeight: TY.weight_heavy },
  none:     { color: C.button_border, fontSize: TY.size_note, fontStyle: 'italic' },
})
