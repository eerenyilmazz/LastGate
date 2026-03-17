import React, { useState, useEffect } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import uiData from '../../data/ui.json'
import themeData from '../../data/theme.json'

const C  = themeData.colors
const TY = themeData.typography as any
const SP = themeData.spacing
const R  = themeData.radius
const MONO  = Platform.select(themeData.ui.font_mono) as string
const INTRO   = uiData.intro
const DOTS    = themeData.ui.terminal_dots
const STRINGS = (uiData as any).strings as Record<string, string>

const LINE_DELAY_MS  = themeData.animation.intro_line_delay_ms
const FIRST_DELAY_MS = themeData.animation.intro_first_delay_ms
const CTA_DELAY_MS   = themeData.animation.intro_cta_delay_ms

interface Props {
  onStart: () => void
}

export const IntroScreen: React.FC<Props> = ({ onStart }) => {
  const [visibleCount, setVisibleCount] = useState(0)
  const [showCTA,      setShowCTA]      = useState(false)
  const [cursor,       setCursor]       = useState(true)

  useEffect(() => {
    if (visibleCount >= INTRO.lines.length) {
      const t = setTimeout(() => setShowCTA(true), CTA_DELAY_MS)
      return () => clearTimeout(t)
    }
    const delay = visibleCount === 0 ? FIRST_DELAY_MS : LINE_DELAY_MS
    const t = setTimeout(() => setVisibleCount(v => v + 1), delay)
    return () => clearTimeout(t)
  }, [visibleCount])

  useEffect(() => {
    if (showCTA) { setCursor(true); return }
    const t = setInterval(() => setCursor(c => !c), themeData.animation.intro_cursor_blink_ms)
    return () => clearInterval(t)
  }, [showCTA])

  return (
    <View style={styles.overlay}>
      <SafeAreaView style={styles.safe}>

        <View style={styles.termHeader}>
          <View style={styles.dots}>
            {DOTS.map((color, i) => (
              <View key={i} style={[styles.dot, { backgroundColor: color }]} />
            ))}
          </View>
          <Text style={[styles.headerText, { fontFamily: MONO }]}>
            {INTRO.header}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.mainArea}>

          <View style={styles.spacerTop} />

          <View style={styles.contentBlock}>
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={[styles.dividerLabel, { fontFamily: MONO }]}>{STRINGS.intro_journal_title}</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.gap} />

            <View style={styles.linesBlock}>
              {INTRO.lines.map((line, i) => (
                <Text
                  key={i}
                  style={[
                    styles.line,
                    { fontFamily: MONO, opacity: i < visibleCount ? 1 : 0 },
                  ]}
                >
                  {line}
                </Text>
              ))}

              <Text style={[styles.cursorLine, { fontFamily: MONO, opacity: (!showCTA && visibleCount > 0) ? 1 : 0 }]}>
                {cursor ? '▌' : ' '}
              </Text>
            </View>
          </View>

          <View style={styles.spacerBottom} />

        </View>

        <View style={[
          styles.bottomArea,
          { paddingBottom: Platform.OS === 'android' ? 36 : 24 },
        ]}>
          {showCTA ? (
            <TouchableOpacity
              onPress={onStart}
              style={styles.ctaBtn}
              activeOpacity={0.75}
            >
              <Text style={[styles.ctaText, { fontFamily: MONO }]}>
                {INTRO.cta}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.ctaPlaceholder} />
          )}
        </View>

      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: C.background,
    zIndex: 100,
    elevation: 100,
  },
  safe: { flex: 1, backgroundColor: C.background },

  termHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: C.background,
    borderBottomWidth: 1,
    borderBottomColor: C.surface,
  },
  dots: { flexDirection: 'row', gap: 5 },
  dot:  { width: 8, height: 8, borderRadius: R.xs },
  headerText: {
    flex: 1,
    textAlign: 'center',
    color: C.button_border,
    fontSize: TY.size_caption,
    letterSpacing: 2,
    fontWeight: TY.weight_bold,
  },

  mainArea: {
    flex: 1,
    paddingHorizontal: 28,
  },

  spacerTop:    { flex: 2 },
  spacerBottom: { flex: 3 },

  contentBlock: {
  },

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: C.card_dark,
  },
  dividerLabel: {
    color: C.button_border,
    fontSize: TY.size_2xs,
    letterSpacing: 2.5,
    fontWeight: TY.weight_heavy,
  },

  gap: { height: 22 },

  linesBlock: {},
  line: {
    color: C.text_secondary,
    fontSize: TY.size_md,
    lineHeight: 26,
    fontWeight: TY.weight_regular,
    letterSpacing: 0.2,
  },
  cursorLine: {
    color: C.text_muted,
    fontSize: TY.size_md,
    lineHeight: 22,
    marginTop: 2,
  },

  bottomArea: {
    paddingHorizontal: 24,
    paddingTop: 12,
    minHeight: 90,
    justifyContent: 'flex-end',
  },
  ctaBtn: {
    paddingVertical: 18,
    borderRadius: R.pill,
    backgroundColor: C.background,
    borderWidth: 1,
    borderColor: C.divider,
    borderLeftWidth: 3,
    borderLeftColor: C.query,
    alignItems: 'center',
  },
  ctaText: {
    color: C.query,
    fontSize: TY.size_body,
    fontWeight: TY.weight_black,
    letterSpacing: 3.5,
  },
  ctaPlaceholder: {
    height: 56,
  },
})
