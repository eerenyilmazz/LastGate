import React, { useState, useEffect } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, Platform,
} from 'react-native'
import uiData from '../../data/ui.json'
import themeData from '../../data/theme.json'

const MONO  = Platform.select(themeData.ui.font_mono) as string
const INTRO = uiData.intro
const DOTS  = themeData.ui.terminal_dots

const LINE_DELAY_MS  = 720
const FIRST_DELAY_MS = 800
const CTA_DELAY_MS   = 500

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
    const t = setInterval(() => setCursor(c => !c), 480)
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
              <Text style={[styles.dividerLabel, { fontFamily: MONO }]}>SEFER GÜNLÜĞÜ</Text>
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
    backgroundColor: '#060402',
    zIndex: 100,
  },
  safe: { flex: 1 },

  termHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: '#0a0705',
    borderBottomWidth: 1,
    borderBottomColor: '#180f06',
  },
  dots: { flexDirection: 'row', gap: 5 },
  dot:  { width: 8, height: 8, borderRadius: 4 },
  headerText: {
    flex: 1,
    textAlign: 'center',
    color: '#251c10',
    fontSize: 9,
    letterSpacing: 2,
    fontWeight: '700',
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
    backgroundColor: '#1e1408',
  },
  dividerLabel: {
    color: '#2e2010',
    fontSize: 8,
    letterSpacing: 2.5,
    fontWeight: '800',
  },

  gap: { height: 22 },

  linesBlock: {},
  line: {
    color: '#6a5a3e',
    fontSize: 14,
    lineHeight: 26,
    fontWeight: '400',
    letterSpacing: 0.2,
  },
  cursorLine: {
    color: '#4a3a22',
    fontSize: 14,
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
    borderRadius: 10,
    backgroundColor: '#0d0905',
    borderWidth: 1,
    borderColor: '#3a2a10',
    borderLeftWidth: 3,
    borderLeftColor: '#7a5520',
    alignItems: 'center',
  },
  ctaText: {
    color: '#b8902a',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 3.5,
  },
  ctaPlaceholder: {
    height: 56,
  },
})
