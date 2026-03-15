import React, { useState, useEffect } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  Platform, Modal, Dimensions, Switch,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Animated, {
  useSharedValue, useAnimatedStyle,
  withRepeat, withSequence, withTiming, withDelay,
} from 'react-native-reanimated'
import { useSettingsStore } from '../store/useSettingsStore'
import { useProgressStore } from '../store/useProgressStore'
import { Difficulty } from '../types/game.types'
import { AppBar } from '../components/AppBar'
import ui from '../data/ui.json'
import config from '../data/config.json'
import themeData from '../data/theme.json'

const { height: SCREEN_H } = Dimensions.get('window')
const MONO       = Platform.select(themeData.ui.font_mono) as string
const CHARACTERS = ui.characters
const TRAITS     = ui.traits
const STATS_INFO = ui.stats_info

type OverlayType = 'howto' | 'guide' | 'settings' | null
type GuideTab = 'chars' | 'traits' | 'stats' | 'buildings' | 'skills'

const InfoRow: React.FC<{ icon: string; name: string; desc: string; accentColor?: string }> = ({
  icon, name, desc, accentColor = '#333',
}) => (
  <View style={[row.container, { borderLeftColor: accentColor + '66' }]}>
    <Text style={row.icon}>{icon}</Text>
    <View style={row.text}>
      <Text style={[row.name, { fontFamily: MONO }]}>{name}</Text>
      <Text style={row.desc}>{desc}</Text>
    </View>
  </View>
)

const PanelHeader: React.FC<{ title: string; onClose: () => void; accentColor?: string }> = ({
  title, onClose, accentColor = '#cc0000',
}) => (
  <View style={[panel.header, { borderBottomColor: accentColor + '33' }]}>
    <View style={panel.dots}>
      <View style={[panel.dot, { backgroundColor: accentColor }]} />
      <View style={[panel.dot, { backgroundColor: accentColor + '88' }]} />
      <View style={[panel.dot, { backgroundColor: accentColor + '44' }]} />
    </View>
    <Text style={[panel.title, { fontFamily: MONO, color: accentColor + 'cc' }]}>{title}</Text>
    <TouchableOpacity onPress={onClose} style={panel.closeBtn} activeOpacity={0.75}>
      <Text style={panel.closeText}>✕</Text>
    </TouchableOpacity>
  </View>
)

const SwipeRow: React.FC<{ gesture: string; action: string; color: string }> = ({ gesture, action, color }) => (
  <View style={content.swipeRow}>
    <View style={[content.swipeGesture, { borderColor: color + '55' }]}>
      <Text style={[content.swipeGestureText, { color, fontFamily: MONO }]}>{gesture}</Text>
    </View>
    <View style={[content.swipeArrow, { backgroundColor: color + '22' }]}>
      <Text style={[content.swipeArrowText, { color }]}>›</Text>
    </View>
    <Text style={[content.swipeAction, { fontFamily: MONO }]}>{action}</Text>
  </View>
)

const HowToPlay: React.FC = () => (
  <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>

    <View style={content.block}>
      <Text style={[content.blockTitle, { fontFamily: MONO }]}>[ KONTROLLER ]</Text>
      <SwipeRow gesture="SAĞ" action="KABUL ET"  color="#2e7d32" />
      <SwipeRow gesture="SOL" action="REDDET"    color="#8b0000" />
      <SwipeRow gesture="YUK" action="SORGULA"   color="#f57c00" />
      <Text style={content.subNote}>Ya da alttaki butonları kullanabilirsin.</Text>
    </View>

    <View style={content.block}>
      <Text style={[content.blockTitle, { fontFamily: MONO }]}>[ HAYATTA KALMA ]</Text>
      <View style={content.statGrid}>
        {themeData.ui.stat_keys.map(k => {
          const color = (themeData.colors as any)[`stat_${k}`] as string
          return (
            <View key={k} style={[content.statChip, { borderColor: color + '44' }]}>
              <Text style={content.statChipIcon}>{(themeData.ui.stat_icons as any)[k]}</Text>
              <Text style={[content.statChipName, { color, fontFamily: MONO }]}>{(themeData.ui.stat_abbrevs as any)[k]}</Text>
            </View>
          )
        })}
      </View>
      <Text style={content.line}>Herhangi biri sıfıra düşerse oyun biter.</Text>
      <View style={content.winBox}>
        <Text style={[content.winText, { fontFamily: MONO }]}>100 GÜN → ŞEHİR KURTARILIR</Text>
      </View>
    </View>

    <View style={content.block}>
      <Text style={[content.blockTitle, { color: '#f57c00', fontFamily: MONO }]}>[ SORGU SİSTEMİ ]</Text>
      <View style={content.infoCard}>
        <Text style={content.line}>›  Her gün <Text style={{ color: '#f57c00', fontWeight: '700' }}>3 sorgu</Text> hakkın var.</Text>
        <Text style={content.line}>›  İlk sorgu <Text style={{ color: '#4caf50', fontWeight: '700' }}>ücretsiz</Text>, 2. ve 3. yiyecek götürür.</Text>
        <Text style={content.line}>›  Sorgu, karakter hakkında ipucu verir.</Text>
        <Text style={content.line}>›  Aynı karaktere tekrar sorgu yapabilirsin.</Text>
      </View>
    </View>

    <View style={content.block}>
      <Text style={[content.blockTitle, { color: '#f57c00', fontFamily: MONO }]}>[ SP · HAYATTA KALMA PUANI ]</Text>
      <View style={content.infoCard}>
        <Text style={content.line}>›  Her gün hayatta kalmak SP kazandırır.</Text>
        <Text style={content.line}>›  SP ile bina inşa et, yetenek satın al.</Text>
        <Text style={content.line}>›  Yeni oyun başlayınca SP sıfırlanır.</Text>
      </View>
    </View>

    <View style={content.block}>
      <Text style={[content.blockTitle, { color: '#c62828', fontFamily: MONO }]}>[ GİZLİ ÖZELLİKLER ]</Text>
      <View style={[content.warnBox, { borderLeftColor: '#8b0000' }]}>
        <Text style={[content.warnText, { fontFamily: MONO }]}>
          UYARI: Yanlış kişiyi kabul etmek şehri çökertebilir.
        </Text>
      </View>
      <Text style={content.line}>›  Her karakterin gizli özelliği olabilir.</Text>
      <Text style={content.line}>›  Sorgu yap, diyaloğu iyi oku, karar ver.</Text>
    </View>

    <View style={{ height: 40 }} />
  </ScrollView>
)

const GuideContent: React.FC = () => {
  const [tab, setTab] = useState<GuideTab>('chars')

  const GUIDE_TABS: { id: GuideTab; label: string }[] = [
    { id: 'chars',     label: 'Karakterler' },
    { id: 'traits',    label: 'Gizli Özellikler' },
    { id: 'stats',     label: 'Değerler' },
    { id: 'buildings', label: 'Binalar' },
    { id: 'skills',    label: 'Yetenekler' },
  ]

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={guide.tabScroll}
        contentContainerStyle={guide.tabContent}
      >
        {GUIDE_TABS.map(t => (
          <TouchableOpacity
            key={t.id}
            onPress={() => setTab(t.id)}
            style={[guide.tabBtn, tab === t.id && guide.tabBtnActive]}
          >
            <Text style={[guide.tabText, tab === t.id && guide.tabTextActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false} style={guide.body}>
        {tab === 'chars' && (
          <View>
            <Text style={content.note}>6 farklı karakter tipi var. Her kararın farklı değerleri etkiler.</Text>
            {CHARACTERS.map(c => <InfoRow key={c.name} {...c} />)}
          </View>
        )}
        {tab === 'traits' && (
          <View>
            <Text style={content.note}>Her karakter gizli bir özellik taşıyor olabilir. Sorgu ile ipucu al!</Text>
            <View style={content.warnBox}>
              <Text style={content.warnText}>Yanlış kişiyi kabul etmek şehri çökertebilir.</Text>
            </View>
            {TRAITS.map(t => <InfoRow key={t.name} {...t} />)}
          </View>
        )}
        {tab === 'stats' && (
          <View>
            <Text style={content.note}>Herhangi biri kritik seviyeye düşerse alarm devreye girer.</Text>
            {STATS_INFO.map(s => <InfoRow key={s.name} {...s} />)}
          </View>
        )}
        {tab === 'buildings' && (
          <View>
            <Text style={content.note}>9 bina var. Gün ilerledikçe yenileri açılır. Her bina her gün pasif bonus sağlar.</Text>
            {(config.buildings as Array<{ icon: string; label: string; unlock_day: number; cost: number; description: string }>).map(b => (
              <View key={b.label} style={row.container}>
                <Text style={row.icon}>{b.icon}</Text>
                <View style={row.text}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={row.name}>{b.label}</Text>
                    <Text style={guide.sub}>Gün {b.unlock_day} · {b.cost} SP</Text>
                  </View>
                  <Text style={row.desc}>{b.description}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
        {tab === 'skills' && (
          <View>
            <Text style={content.note}>9 yetenek var. Tek seferlik güçlü müdahaleler — doğru zamanda kullan!</Text>
            {(config.skills as Array<{ icon: string; label: string; unlock_day: number; cost: number; desc: string }>).map(s => (
              <View key={s.label} style={row.container}>
                <Text style={row.icon}>{s.icon}</Text>
                <View style={row.text}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={row.name}>{s.label}</Text>
                    <Text style={guide.sub}>Gün {s.unlock_day} · {s.cost} SP</Text>
                  </View>
                  <Text style={row.desc}>{s.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  )
}

const SettingsContent: React.FC = () => {
  const settings = useSettingsStore()
  const progress = useProgressStore()
  return (
    <ScrollView showsVerticalScrollIndicator={false}>

      <View style={sett.card}>
        <View style={sett.cardLeft}>
          <Text style={[sett.cardTitle, { fontFamily: MONO }]}>SES SİSTEMİ</Text>
          <Text style={sett.cardSub}>Ortam müziği ve ses efektleri</Text>
        </View>
        <TouchableOpacity
          onPress={settings.toggleSound}
          style={[sett.toggle, settings.soundEnabled && sett.toggleOn]}
          activeOpacity={0.8}
        >
          <Text style={[sett.toggleText, { fontFamily: MONO, color: settings.soundEnabled ? '#4caf50' : '#444' }]}>
            {settings.soundEnabled ? 'AÇIK' : 'KAPALI'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={[sett.card, { borderColor: '#221500' }]}>
        <View style={sett.cardLeft}>
          <Text style={[sett.cardTitle, { color: '#f57c00', fontFamily: MONO }]}>HAYATTA KALMA PUANI</Text>
          <Text style={sett.cardSub}>Bu oyun boyunca birikir · binalar ve yetenekler için</Text>
        </View>
        <View style={sett.spBox}>
          <Text style={[sett.spStar, { fontFamily: MONO }]}>★</Text>
          <Text style={[sett.spVal, { fontFamily: MONO }]}>{progress.sp}</Text>
        </View>
      </View>

      <View style={sett.earnBlock}>
        <Text style={[sett.earnTitle, { fontFamily: MONO }]}>SP KAZANIM TABLOSU</Text>
        {[
          { label: 'Her hayatta kalınan gün', val: `+${config.sp_rewards.day_survived}` },
          { label: 'Doğru NPC kararı',        val: `+${config.sp_rewards.correct_npc_decision}` },
          { label: 'Event atlatma',            val: `+${config.sp_rewards.event_survived}` },
          { label: 'Mükemmel gün (kayıpsız)',  val: `+${config.sp_rewards.perfect_day}` },
        ].map(r => (
          <View key={r.label} style={sett.earnRow}>
            <Text style={sett.earnLabel}>{r.label}</Text>
            <Text style={[sett.earnVal, { fontFamily: MONO }]}>{r.val}</Text>
          </View>
        ))}
      </View>

      <View style={sett.versionBlock}>
        <Text style={[sett.versionText, { fontFamily: MONO }]}>LAST GATE · BETA v0.1</Text>
        <Text style={[sett.versionSub, { fontFamily: MONO }]}>SEKTOR 7 · KARANTİNA</Text>
      </View>

      <View style={{ height: 20 }} />
    </ScrollView>
  )
}

interface Props {
  onStart: () => void
}

export const MenuScreen: React.FC<Props> = ({ onStart }) => {
  const progress = useProgressStore()
  const settings = useSettingsStore()
  const [overlay, setOverlay] = useState<OverlayType>(null)

  const emblemPulse = useSharedValue(1)
  useEffect(() => {
    emblemPulse.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 1800 }),
        withTiming(0.96, { duration: 1800 }),
      ), -1, true,
    )
  }, [])
  const emblemStyle = useAnimatedStyle(() => ({
    transform: [{ scale: emblemPulse.value }],
  }))

  const close = () => setOverlay(null)

  return (
    <SafeAreaView style={styles.safe}>

      <AppBar />

      <View style={styles.logoArea}>
        <Animated.Text style={[styles.emblem, emblemStyle]}>☣</Animated.Text>
        <Text style={styles.title}>LAST GATE</Text>
        <Text style={styles.titleSub}>— SON KAPI —</Text>

        {progress.totalRuns > 0 && (
          <View style={meta.runRow}>
            <View style={meta.runStat}>
              <Text style={meta.runVal}>{progress.bestDay}</Text>
              <Text style={meta.runLabel}>EN İYİ GÜN</Text>
            </View>
            <View style={meta.runDivider} />
            <View style={meta.runStat}>
              <Text style={meta.runVal}>{progress.totalRuns}</Text>
              <Text style={meta.runLabel}>TOPLAM</Text>
            </View>
            <View style={meta.runDivider} />
            <View style={meta.runStat}>
              <Text style={[meta.runVal, progress.totalWins > 0 && { color: '#4caf50' }]}>
                {progress.totalWins}
              </Text>
              <Text style={meta.runLabel}>ZAFERLİ</Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.menuArea}>

        <View style={diff.row}>
          {(['easy', 'normal', 'hard'] as Difficulty[]).map((d) => {
            const labels: Record<Difficulty, string> = { easy: 'KOLAY', normal: 'NORMAL', hard: 'ZOR' }
            const active = settings.difficulty === d
            const colors: Record<Difficulty, string> = { easy: '#2e7d32', normal: '#f57c00', hard: '#8b0000' }
            return (
              <TouchableOpacity
                key={d}
                onPress={() => settings.setDifficulty(d)}
                style={[diff.btn, active && { borderColor: colors[d], backgroundColor: colors[d] + '22' }]}
                activeOpacity={0.75}
              >
                <Text style={[diff.label, { color: active ? colors[d] : '#2a2a2a' }]}>{labels[d]}</Text>
              </TouchableOpacity>
            )
          })}
        </View>

        <TouchableOpacity onPress={onStart} style={styles.startBtn} activeOpacity={0.85}>
          <Text style={styles.startText}>YENİ OYUN</Text>
          <Text style={styles.startArrow}>▶</Text>
        </TouchableOpacity>

        <View style={styles.menuSpacer} />

        <TouchableOpacity onPress={() => setOverlay('howto')} style={styles.menuBtn} activeOpacity={0.8}>
          <Text style={styles.menuBtnLabel}>NASIL OYNANIR</Text>
          <Text style={styles.menuBtnArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setOverlay('guide')} style={styles.menuBtn} activeOpacity={0.8}>
          <Text style={styles.menuBtnLabel}>REHBER</Text>
          <Text style={styles.menuBtnArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setOverlay('settings')} style={styles.menuBtn} activeOpacity={0.8}>
          <Text style={styles.menuBtnLabel}>AYARLAR</Text>
          <Text style={styles.menuBtnArrow}>›</Text>
        </TouchableOpacity>

      </View>

      <Text style={styles.footer}>BETA v0.1 · SEKTÖR 7 KARANTİNA BÖLGESİ</Text>

      <Modal
        visible={overlay !== null}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={close}
      >
        <View style={panel.backdrop}>
          <TouchableOpacity style={panel.dismissArea} onPress={close} activeOpacity={1} />

          <View style={panel.container}>
            <View style={[
              panel.accentBar,
              {
                backgroundColor: overlay === 'howto'    ? '#8b0000'
                               : overlay === 'guide'    ? '#f57c00'
                               : '#2e7d32',
              },
            ]} />

            {overlay === 'howto' && (
              <>
                <PanelHeader title="NASIL OYNANIR" onClose={close} accentColor="#cc3333" />
                <View style={{ flex: 1, paddingHorizontal: 20 }}>
                  <HowToPlay />
                </View>
              </>
            )}
            {overlay === 'guide' && (
              <>
                <PanelHeader title="REHBER" onClose={close} accentColor="#f57c00" />
                <View style={{ flex: 1 }}>
                  <GuideContent />
                </View>
              </>
            )}
            {overlay === 'settings' && (
              <>
                <PanelHeader title="AYARLAR" onClose={close} accentColor="#4caf50" />
                <View style={{ flex: 1, paddingHorizontal: 20 }}>
                  <SettingsContent />
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#090604' },

  logoArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emblem: {
    fontSize: 48,
    color: '#8b0000',
    textShadowColor: '#cc000066',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  title: {
    color: '#e8e8e8',
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: 10,
    textShadowColor: '#cc000044',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  titleSub: {
    color: '#4a0000',
    fontSize: 11,
    letterSpacing: 8,
    marginTop: -2,
  },
  spRow: {
    marginTop: 10,
    backgroundColor: '#0d0800',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#221500',
  },
  spText: {
    color: '#554400',
    fontSize: 11,
    letterSpacing: 1,
  },

  menuArea: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'android' ? 28 : 20,
    gap: 8,
  },

  startBtn: {
    backgroundColor: '#8b0000',
    borderRadius: 10,
    paddingVertical: 18,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#cc000033',
    shadowColor: '#cc0000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  startText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 4,
  },
  startArrow: {
    color: '#ff6666',
    fontSize: 16,
    fontWeight: '900',
  },

  menuSpacer: { height: 4 },

  menuBtn: {
    backgroundColor: '#100e0b',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#1e1a14',
  },
  menuBtnLabel: {
    color: '#888',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 2,
  },
  menuBtnArrow: {
    color: '#333',
    fontSize: 18,
    fontWeight: '900',
  },

  footer: {
    color: '#1c0000',
    fontSize: 8,
    letterSpacing: 2,
    textAlign: 'center',
    paddingBottom: Platform.OS === 'android' ? 12 : 8,
  },
})

const panel = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.82)',
    justifyContent: 'flex-end',
  },
  dismissArea: {
    flex: 1,
  },
  container: {
    backgroundColor: '#0c0906',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 0,
    borderColor: 'transparent',
    height: SCREEN_H * 0.82,
    paddingBottom: Platform.OS === 'android' ? 28 : 20,
    overflow: 'hidden',
  },
  accentBar: {
    height: 3,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1410',
    backgroundColor: '#110d09',
  },
  dots: { flexDirection: 'row', gap: 5 },
  dot:  { width: 7, height: 7, borderRadius: 4 },
  title: {
    flex: 1,
    color: '#cc0000',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
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
  closeText: {
    color: '#555',
    fontSize: 11,
    fontWeight: '900',
  },
})

const content = StyleSheet.create({
  block: {
    marginBottom: 20,
    gap: 8,
  },
  blockTitle: {
    color: '#cc3333',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 4,
  },
  infoCard: {
    backgroundColor: '#0f0c08',
    borderWidth: 1,
    borderColor: '#1e1810',
    borderRadius: 8,
    padding: 12,
    gap: 6,
  },

  swipeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  swipeGesture: {
    width: 40,
    height: 28,
    borderRadius: 5,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f0c08',
  },
  swipeGestureText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  swipeArrow: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swipeArrowText: { fontSize: 16, fontWeight: '900', lineHeight: 20 },
  swipeAction: { color: '#666', fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  subNote: { color: '#2a2a2a', fontSize: 11, marginTop: 2 },

  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    backgroundColor: '#0f0c08',
  },
  statChipIcon: { fontSize: 11 },
  statChipName: { fontSize: 9, fontWeight: '800', letterSpacing: 1 },

  winBox: {
    backgroundColor: '#001800',
    borderWidth: 1,
    borderColor: '#1b5e2055',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  winText: { color: '#2e7d32', fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },

  section: { marginBottom: 20, gap: 4 },
  sectionTitle: {
    color: '#cc0000',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 3,
    marginBottom: 8,
    marginTop: 4,
  },
  line: { color: '#666', fontSize: 12, lineHeight: 21 },
  hi:   { color: '#ff9800', fontWeight: '700' },
  note: { color: '#3d3d3d', fontSize: 12, lineHeight: 18, marginBottom: 12, fontStyle: 'italic' },
  warnBox: {
    backgroundColor: '#0d0000',
    borderLeftWidth: 2,
    borderLeftColor: '#8b0000',
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 4,
  },
  warnText: { color: '#550000', fontSize: 11, fontWeight: '700' },
})

const guide = StyleSheet.create({
  tabScroll: { maxHeight: 44 },
  tabContent: {
    paddingHorizontal: 16,
    gap: 6,
    alignItems: 'center',
    paddingVertical: 8,
  },
  tabBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#120e0a',
    borderWidth: 1,
    borderColor: '#1e1812',
  },
  tabBtnActive:  { backgroundColor: '#1a0000', borderColor: '#330000' },
  tabText:       { color: '#444', fontSize: 12, fontWeight: '600' },
  tabTextActive: { color: '#cc6666' },
  body: { flex: 1, paddingHorizontal: 16, paddingTop: 8 },
  sub:  { color: '#333', fontSize: 10, letterSpacing: 0.5 },
})

const sett = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#100e0b',
    borderWidth: 1,
    borderColor: '#1e1a14',
    borderRadius: 10,
    padding: 14,
    marginTop: 12,
    gap: 10,
  },
  cardLeft: { flex: 1 },
  cardTitle: { color: '#888', fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 3 },
  cardSub:   { color: '#2a2a2a', fontSize: 11, lineHeight: 15 },

  toggle: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    minWidth: 64,
    alignItems: 'center',
  },
  toggleOn:   { backgroundColor: '#001800', borderColor: '#1b5e2055' },
  toggleText: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },

  spBox:  { alignItems: 'center' },
  spStar: { color: '#f57c00', fontSize: 14 },
  spVal:  { color: '#f57c00', fontSize: 20, fontWeight: '900' },

  earnBlock: {
    backgroundColor: '#0c0906',
    borderWidth: 1,
    borderColor: '#1a1410',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    gap: 0,
  },
  earnTitle: {
    color: '#2a2a2a',
    fontSize: 9,
    letterSpacing: 2,
    marginBottom: 10,
    fontWeight: '700',
  },
  earnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#160f08',
  },
  earnLabel: { color: '#3a3a3a', fontSize: 11 },
  earnVal:   { color: '#f57c00', fontSize: 12, fontWeight: '800' },

  versionBlock: {
    alignItems: 'center',
    marginTop: 24,
    gap: 4,
  },
  versionText: { color: '#1a1a1a', fontSize: 10, letterSpacing: 2 },
  versionSub:  { color: '#111', fontSize: 8, letterSpacing: 3 },
})

const meta = StyleSheet.create({
  runRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0d0a07',
    borderWidth: 1,
    borderColor: '#1e1a10',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 10,
    gap: 0,
  },
  runStat: { flex: 1, alignItems: 'center', gap: 2 },
  runVal: { color: '#555', fontSize: 16, fontWeight: '900' },
  runLabel: { color: '#2a2a2a', fontSize: 8, letterSpacing: 1.5, fontWeight: '700' },
  runDivider: { width: 1, height: 28, backgroundColor: '#1e1510' },
})

const diff = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  btn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e1a14',
    backgroundColor: '#100e0b',
    alignItems: 'center',
  },
  label: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
})

const row = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: '#333',
  },
  icon: { fontSize: 18, width: 26, textAlign: 'center' },
  text: { flex: 1 },
  name: { color: '#bbb', fontSize: 13, fontWeight: '700', marginBottom: 2 },
  desc: { color: '#444', fontSize: 11, lineHeight: 16 },
})
