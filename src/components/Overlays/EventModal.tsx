import React from 'react'
import {
  View, Text, TouchableOpacity, Modal, ScrollView,
  StyleSheet, Platform,
} from 'react-native'
import { GameEvent, EventChoice } from '../../types/event.types'
import { NPCRole } from '../../types/npc.types'
import themeData from '../../data/theme.json'

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
              borderColor: pos ? '#1b5e2055' : '#b71c1c55',
              backgroundColor: pos ? '#0a1a0a' : '#1a0000',
            }]}
          >
            <Text style={es.chipIcon}>{STAT_ICONS[stat] ?? stat}</Text>
            <Text style={[es.chipVal, { color: pos ? '#4caf50' : '#ef5350' }]}>
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
  const color = CHOICE_COLOR[choice.id] ?? '#555'

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
        borderColor: color + '33',
        backgroundColor: color + '0d',
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
  const hasRoleBonus = (requires_role: NPCRole | null) =>
    !!requires_role && acceptedRoles.includes(requires_role)

  return (
    <Modal transparent animationType="slide" visible>
      <View style={es.backdrop}>
        <View style={es.sheet}>

          <View style={es.termHeader}>
            <View style={es.dots}>
              <View style={[es.dot, { backgroundColor: DOTS[0] }]} />
              <View style={[es.dot, { backgroundColor: DOTS[1] }]} />
              <View style={[es.dot, { backgroundColor: DOTS[2] }]} />
            </View>
            <Text style={[es.termTitle, { fontFamily: MONO }]}>
              OLAY · {event.category.toUpperCase()}
            </Text>
            <View style={{ width: 36 }} />
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
              <Text style={[es.dividerText, { fontFamily: MONO }]}>BİR SEÇİM YAP</Text>
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
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#1a1208',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderColor: '#2e1e10',
    maxHeight: '88%',
    paddingBottom: Platform.OS === 'android' ? 28 : 20,
  },

  termHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 13,
    backgroundColor: '#120e07',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2a1c10',
  },
  dots: { flexDirection: 'row', gap: 5 },
  dot:  { width: 8, height: 8, borderRadius: 4 },
  termTitle: {
    flex: 1,
    color: '#5a4a30',
    fontSize: 9,
    letterSpacing: 2,
    fontWeight: '700',
    textAlign: 'center',
  },

  body: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 12,
  },

  eventTitle: {
    color: '#ede8e0',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  descBlock: {
    backgroundColor: '#120e07',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2a1c10',
    borderLeftWidth: 3,
    borderLeftColor: '#3d2c1c',
    padding: 12,
  },
  descText: {
    color: '#a08870',
    fontSize: 12,
    lineHeight: 20,
  },

  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#2a1e10' },
  dividerText: {
    color: '#4a3828',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
  },

  choicesBlock: { gap: 8 },

  choiceBtn: {
    borderRadius: 10,
    borderWidth: 1,
    borderLeftWidth: 4,
    padding: 12,
    gap: 8,
  },

  choiceTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  badge: {
    width: 26,
    height: 26,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  badgeLetter: {
    fontSize: 12,
    fontWeight: '900',
  },

  choiceLabel: {
    flex: 1,
    color: '#d8d0c4',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },

  bonusBadge: {
    backgroundColor: '#1a1400',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#f57f1744',
    paddingHorizontal: 5,
    paddingVertical: 2,
    flexShrink: 0,
  },
  bonusText: {
    color: '#f57f17',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  chipArea: { paddingLeft: 36 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 5,
    borderWidth: 1,
  },
  chipIcon: { fontSize: 11 },
  chipVal:  { fontSize: 11, fontWeight: '800' },
  none:     { color: '#3a2e20', fontSize: 11, fontStyle: 'italic' },
})
