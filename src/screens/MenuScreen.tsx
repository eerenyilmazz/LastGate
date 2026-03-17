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
const C  = themeData.colors
const TY = themeData.typography as any
const SP = themeData.spacing
const R  = themeData.radius
const MONO       = Platform.select(themeData.ui.font_mono) as string
const CHARACTERS = ui.characters
const TRAITS     = ui.traits
const STATS_INFO = ui.stats_info
const STRINGS    = (ui as any).strings as Record<string, string>

type OverlayType = 'howto' | 'guide' | 'settings' | null
type GuideTab = 'chars' | 'traits' | 'stats' | 'buildings' | 'skills'

const InfoRow: React.FC<{ icon: string; name: string; desc: string; accentColor?: string }> = ({
  icon, name, desc, accentColor = C.text_muted,
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
  title, onClose, accentColor = C.danger,
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
      <SwipeRow gesture="SAĞ" action="KABUL ET"  color={C.accept} />
      <SwipeRow gesture="SOL" action="REDDET"    color={C.reject} />
      <SwipeRow gesture="DOKUN" action="SORGULA"   color={C.query} />
      <Text style={content.subNote}>{STRINGS.howto_alt_hint}</Text>
    </View>

    <View style={content.block}>
      <Text style={[content.blockTitle, { fontFamily: MONO }]}>[ HEDEF ]</Text>
      <View style={content.infoCard}>
        <Text style={content.line}>›  Kapıya gelen kişileri kabul ya da reddet.</Text>
        <Text style={content.line}>›  5 değerin sıfıra düşmemesini sağla.</Text>
        <Text style={content.line}>›  <Text style={{ color: C.accept, fontWeight: TY.weight_bold }}>100 gün</Text> hayatta kalırsan şehir kurtarılır.</Text>
      </View>
      <View style={content.winBox}>
        <Text style={[content.winText, { fontFamily: MONO }]}>{STRINGS.win_banner}</Text>
      </View>
    </View>

    <View style={content.block}>
      <Text style={[content.blockTitle, { fontFamily: MONO }]}>[ DEĞERLERİN ANLAMI ]</Text>
      {[
        { k: 'immunity',   end: 'Veba — salgın şehri siler' },
        { k: 'food',       end: 'Açlık — nüfus çöker' },
        { k: 'population', end: 'Yok Oluş — kimse kalmadı' },
        { k: 'defense',    end: 'İhlal — zombiler içeri girdi' },
        { k: 'economy',    end: 'Çöküş — ticaret ve düzen bitti' },
      ].map(({ k, end }) => {
        const color = (themeData.colors as any)[`stat_${k}`] as string
        return (
          <View key={k} style={content.statEndRow}>
            <View style={[content.statChip, { borderColor: color + '44', marginBottom: 0 }]}>
              <Text style={content.statChipIcon}>{(themeData.ui.stat_icons as any)[k]}</Text>
              <Text style={[content.statChipName, { color, fontFamily: MONO }]}>{(themeData.ui.stat_names_tr as any)[k]}</Text>
            </View>
            <Text style={content.statEndText}>= 0 → {end}</Text>
          </View>
        )
      })}
    </View>

    <View style={content.block}>
      <Text style={[content.blockTitle, { color: C.danger, fontFamily: MONO }]}>[ ZİNCİRLEME ETKİLER ]</Text>
      <View style={content.warnBox}>
        <Text style={[content.warnText, { fontFamily: MONO }]}>
          Bir değer kritik seviyeye düşünce her gün diğerlerini de aşağı çeker!
        </Text>
      </View>
      <View style={content.infoCard}>
        <Text style={content.line}>›  <Text style={{ color: C.stat_immunity, fontWeight: TY.weight_bold }}>Bağışıklık</Text> kritik → Nüfus −2/gün</Text>
        <Text style={content.line}>›  <Text style={{ color: C.stat_food, fontWeight: TY.weight_bold }}>Yiyecek</Text> kritik → Ekonomi −3, Savunma −2/gün</Text>
        <Text style={content.line}>›  <Text style={{ color: C.stat_defense, fontWeight: TY.weight_bold }}>Savunma</Text> kritik → Yiyecek −8, Ekonomi −5, Nüfus −3/gün</Text>
        <Text style={content.line}>›  <Text style={{ color: C.stat_economy, fontWeight: TY.weight_bold }}>Ekonomi</Text> kritik → Yiyecek −5, Savunma −3/gün</Text>
        <Text style={content.line}>›  <Text style={{ color: C.stat_population, fontWeight: TY.weight_bold }}>Nüfus</Text> kritik → Ekonomi −5, Savunma −3/gün</Text>
      </View>
    </View>

    <View style={content.block}>
      <Text style={[content.blockTitle, { color: C.query, fontFamily: MONO }]}>[ SORGU SİSTEMİ ]</Text>
      <View style={content.infoCard}>
        <Text style={content.line}>›  Günde <Text style={{ color: C.query, fontWeight: TY.weight_bold }}>3 sorgu</Text> hakkın var.</Text>
        <Text style={content.line}>›  <Text style={{ color: C.accept_glow, fontWeight: TY.weight_bold }}>1. sorgu</Text> — ücretsiz, ipucu verir</Text>
        <Text style={content.line}>›  <Text style={{ color: C.query, fontWeight: TY.weight_bold }}>2. sorgu</Text> — Ekonomi ~−8, Yiyecek ~−5 (rastgele değişir)</Text>
        <Text style={content.line}>›  <Text style={{ color: C.danger, fontWeight: TY.weight_bold }}>3. sorgu</Text> — Ekonomi ~−10, Savunma ~−6, Bağışıklık ~−3 (rastgele değişir)</Text>
        <Text style={content.line}>›  Aynı karaktere birden fazla sorgu yapabilirsin.</Text>
      </View>
      <View style={content.warnBox}>
        <Text style={[content.warnText, { fontFamily: MONO }]}>
          Tehlikeli kişiler sorguyu geçebilir! Yalancı %30, Casus %15, Enfekte %10 ihtimalle temiz görünür.
        </Text>
      </View>
    </View>

    <View style={content.block}>
      <Text style={[content.blockTitle, { color: C.danger, fontFamily: MONO }]}>[ GİZLİ ÖZELLİKLER ]</Text>
      <View style={content.warnBox}>
        <Text style={[content.warnText, { fontFamily: MONO }]}>
          Yanlış kişiyi kabul etmek şehri çökertebilir!
        </Text>
      </View>
      <View style={content.infoCard}>
        <Text style={content.line}>›  Her karakterin gizli bir özelliği olabilir.</Text>
        <Text style={content.line}>›  Kabul ettikten günler sonra etkisi başlar.</Text>
        <Text style={content.line}>›  Diyaloğu dikkatli oku, sorgu kullan.</Text>
      </View>
    </View>

    <View style={content.block}>
      <Text style={[content.blockTitle, { color: C.query, fontFamily: MONO }]}>[ HAYATTA KALMA PUANI ]</Text>
      <View style={content.infoCard}>
        <Text style={content.line}>›  Her hayatta kalınan gün SP kazanırsın.</Text>
        <Text style={content.line}>›  SP ile <Text style={{ color: C.accept, fontWeight: TY.weight_bold }}>bina</Text> inşa et ve <Text style={{ color: C.info, fontWeight: TY.weight_bold }}>yetenek</Text> satın al.</Text>
        <Text style={content.line}>›  Binalar her gün pasif bonus sağlar.</Text>
      </View>
    </View>

    <View style={content.block}>
      <Text style={[content.blockTitle, { color: C.danger, fontFamily: MONO }]}>[ ZORLUK SEVİYELERİ ]</Text>
      <View style={content.infoCard}>
        <Text style={content.line}>
          <Text style={{ color: C.accept, fontWeight: TY.weight_bold }}>KOLAY</Text>
          {'  '}— Her gün +2 Yiyecek bonus. NPC etkileri %25 hafifletilmiş. Başlangıç değerleri daha yüksek.
        </Text>
        <Text style={content.line}>
          <Text style={{ color: C.query, fontWeight: TY.weight_bold }}>NORMAL</Text>
          {'  '}— Standart oyun. Bonus veya ceza yok.
        </Text>
        <Text style={content.line}>
          <Text style={{ color: C.danger, fontWeight: TY.weight_bold }}>ZOR</Text>
          {'  '}— Her gün −3 Yiyecek. Açlıkta her gün ek −2 Nüfus. NPC etkileri %30 daha sert. Başlangıç değerleri düşük.
        </Text>
      </View>
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
          <Text style={[sett.cardTitle, { fontFamily: MONO }]}>ORTAM MÜZİĞİ</Text>
          <Text style={sett.cardSub}>Arka plan atmosfer müziği</Text>
        </View>
        <TouchableOpacity
          onPress={settings.toggleMusic}
          style={[sett.toggle, settings.musicEnabled && sett.toggleOn]}
          activeOpacity={0.8}
        >
          <Text style={[sett.toggleText, { fontFamily: MONO, color: settings.musicEnabled ? C.accept_glow : C.text_muted }]}>
            {settings.musicEnabled ? 'AÇIK' : 'KAPALI'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={sett.card}>
        <View style={sett.cardLeft}>
          <Text style={[sett.cardTitle, { fontFamily: MONO }]}>SES EFEKTLERİ</Text>
          <Text style={sett.cardSub}>Kapı, sorgu ve uyarı sesleri</Text>
        </View>
        <TouchableOpacity
          onPress={settings.toggleSfx}
          style={[sett.toggle, settings.sfxEnabled && sett.toggleOn]}
          activeOpacity={0.8}
        >
          <Text style={[sett.toggleText, { fontFamily: MONO, color: settings.sfxEnabled ? C.accept_glow : C.text_muted }]}>
            {settings.sfxEnabled ? 'AÇIK' : 'KAPALI'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={[sett.card, { borderColor: C.button_border }]}>
        <View style={sett.cardLeft}>
          <Text style={[sett.cardTitle, { color: C.query, fontFamily: MONO }]}>HAYATTA KALMA PUANI</Text>
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
        withTiming(1.06, { duration: themeData.animation.menu_logo_pulse_ms }),
        withTiming(0.96, { duration: themeData.animation.menu_logo_pulse_ms }),
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
              <Text style={[meta.runVal, progress.totalWins > 0 && { color: C.accept_glow }]}>
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
            const colors: Record<Difficulty, string> = { easy: C.accept, normal: C.query, hard: C.danger }
            return (
              <TouchableOpacity
                key={d}
                onPress={() => settings.setDifficulty(d)}
                style={[diff.btn, active && { borderColor: colors[d], backgroundColor: colors[d] + '22' }]}
                activeOpacity={0.75}
              >
                <Text style={[diff.label, { color: active ? colors[d] : C.text_muted }]}>{labels[d]}</Text>
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

      <Text style={styles.footer}>{STRINGS.menu_footer}</Text>

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
                backgroundColor: overlay === 'howto'    ? C.danger_dark
                               : overlay === 'guide'    ? C.query
                               : C.accept,
              },
            ]} />

            {overlay === 'howto' && (
              <>
                <PanelHeader title="NASIL OYNANIR" onClose={close} accentColor={C.panel_howto} />
                <View style={{ flex: 1, paddingHorizontal: 20 }}>
                  <HowToPlay />
                </View>
              </>
            )}
            {overlay === 'guide' && (
              <>
                <PanelHeader title="REHBER" onClose={close} accentColor={C.panel_guide} />
                <View style={{ flex: 1 }}>
                  <GuideContent />
                </View>
              </>
            )}
            {overlay === 'settings' && (
              <>
                <PanelHeader title="AYARLAR" onClose={close} accentColor={C.panel_settings} />
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
  safe: { flex: 1, backgroundColor: C.bg_deeper },

  logoArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emblem: {
    fontSize: TY.size_display,
    color: C.danger_dark,
    textShadowColor: C.danger + '66',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  title: {
    color: C.text_bright,
    fontSize: TY.size_display,
    fontWeight: TY.weight_black,
    letterSpacing: 10,
    textShadowColor: C.danger + '44',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  titleSub: {
    color: C.border_neg,
    fontSize: TY.size_note,
    letterSpacing: 8,
    marginTop: -2,
  },
  spRow: {
    marginTop: 10,
    backgroundColor: C.bg_deeper,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: C.button_border,
  },
  spText: {
    color: C.text_muted,
    fontSize: TY.size_note,
    letterSpacing: 1,
  },

  menuArea: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'android' ? 28 : 20,
    gap: 8,
  },

  startBtn: {
    backgroundColor: C.danger_dark,
    borderRadius: R.pill,
    paddingVertical: 18,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: C.danger + '33',
    shadowColor: C.danger,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  startText: {
    color: C.text_primary,
    fontSize: TY.size_h6_alt,
    fontWeight: TY.weight_black,
    letterSpacing: 4,
  },
  startArrow: {
    color: C.reject_glow,
    fontSize: TY.size_h6,
    fontWeight: TY.weight_black,
  },

  menuSpacer: { height: 4 },

  menuBtn: {
    backgroundColor: C.bg_deeper,
    borderRadius: R.md,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: C.card_dark,
  },
  menuBtnLabel: {
    color: C.text_muted,
    fontSize: TY.size_body,
    fontWeight: TY.weight_bold,
    letterSpacing: 2,
  },
  menuBtnArrow: {
    color: C.text_muted,
    fontSize: TY.size_lg,
    fontWeight: TY.weight_black,
  },

  footer: {
    color: C.danger_dark,
    fontSize: TY.size_2xs,
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
    backgroundColor: C.bg_deeper,
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
    borderBottomColor: C.card_dark,
    backgroundColor: C.bg_deeper,
  },
  dots: { flexDirection: 'row', gap: 5 },
  dot:  { width: 7, height: 7, borderRadius: R.xs },
  title: {
    flex: 1,
    color: C.danger,
    fontSize: TY.size_note,
    fontWeight: TY.weight_black,
    letterSpacing: 2,
    textAlign: 'center',
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: R.lg,
    backgroundColor: C.card_dark,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.text_muted,
  },
  closeText: {
    color: C.text_muted,
    fontSize: TY.size_note,
    fontWeight: TY.weight_black,
  },
})

const content = StyleSheet.create({
  block: {
    marginBottom: 20,
    gap: 8,
  },
  blockTitle: {
    color: C.danger,
    fontSize: TY.size_xs,
    fontWeight: TY.weight_black,
    letterSpacing: 2,
    marginBottom: 4,
  },
  infoCard: {
    backgroundColor: C.bg_deeper,
    borderWidth: 1,
    borderColor: C.card_dark,
    borderRadius: R.md,
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
    borderRadius: R.xs,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.bg_deeper,
  },
  swipeGestureText: { fontSize: TY.size_caption, fontWeight: TY.weight_black, letterSpacing: 0.5 },
  swipeArrow: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swipeArrowText: { fontSize: TY.size_h6, fontWeight: TY.weight_black, lineHeight: 20 },
  swipeAction: { color: C.text_bright, fontSize: TY.size_sm, fontWeight: TY.weight_bold, letterSpacing: 1 },
  subNote: { color: C.text_muted, fontSize: TY.size_note, marginTop: 2 },

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
    borderRadius: R.sm,
    borderWidth: 1,
    backgroundColor: C.bg_deeper,
  },
  statChipIcon: { fontSize: TY.size_note },
  statChipName: { fontSize: TY.size_xs, fontWeight: TY.weight_heavy, letterSpacing: 0.5 },

  statEndRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  statEndText: {
    flex: 1,
    color: C.text_secondary,
    fontSize: TY.size_note,
    lineHeight: 18,
  },

  winBox: {
    backgroundColor: C.diff_pos_bg,
    borderWidth: 1,
    borderColor: (C.accept + '55'),
    borderRadius: R.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  winText: { color: C.accept, fontSize: TY.size_xs, fontWeight: TY.weight_heavy, letterSpacing: 1.5 },

  section: { marginBottom: 20, gap: 4 },
  sectionTitle: {
    color: C.danger,
    fontSize: TY.size_xs,
    fontWeight: TY.weight_black,
    letterSpacing: 3,
    marginBottom: 8,
    marginTop: 4,
  },
  line: { color: C.text_muted, fontSize: TY.size_sm, lineHeight: 21 },
  hi:   { color: C.query, fontWeight: TY.weight_bold },
  note: { color: C.text_muted, fontSize: TY.size_sm, lineHeight: 18, marginBottom: 12, fontStyle: 'italic' },
  warnBox: {
    backgroundColor: C.warning_box_bg,
    borderLeftWidth: 2,
    borderLeftColor: C.danger,
    borderRadius: R.xs,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 4,
  },
  warnText: { color: C.danger, fontSize: TY.size_note, fontWeight: TY.weight_bold },
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
    borderRadius: R.sm,
    backgroundColor: C.bg_deeper,
    borderWidth: 1,
    borderColor: C.card_dark,
  },
  tabBtnActive:  { backgroundColor: C.danger_dark, borderColor: C.danger },
  tabText:       { color: C.text_secondary, fontSize: TY.size_sm, fontWeight: TY.weight_semi },
  tabTextActive: { color: C.danger },
  body: { flex: 1, paddingHorizontal: 16, paddingTop: 8 },
  sub:  { color: C.text_muted, fontSize: TY.size_xs, letterSpacing: 0.5 },
})

const sett = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.bg_deeper,
    borderWidth: 1,
    borderColor: C.card_dark,
    borderRadius: R.pill,
    padding: 14,
    marginTop: 12,
    gap: 10,
  },
  cardLeft: { flex: 1 },
  cardTitle: { color: C.text_bright, fontSize: TY.size_xs, fontWeight: TY.weight_heavy, letterSpacing: 1.5, marginBottom: 3 },
  cardSub:   { color: C.text_secondary, fontSize: TY.size_note, lineHeight: 15 },

  toggle: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: C.card_dark,
    borderWidth: 1,
    borderColor: C.text_muted,
    minWidth: 64,
    alignItems: 'center',
  },
  toggleOn:   { backgroundColor: C.diff_pos_bg, borderColor: (C.accept + '55') },
  toggleText: { fontSize: TY.size_xs, fontWeight: TY.weight_heavy, letterSpacing: 1 },

  spBox:  { alignItems: 'center' },
  spStar: { color: C.query, fontSize: TY.size_md },
  spVal:  { color: C.query, fontSize: TY.size_h5, fontWeight: TY.weight_black },

  earnBlock: {
    backgroundColor: C.bg_deeper,
    borderWidth: 1,
    borderColor: C.card_dark,
    borderRadius: R.md,
    padding: 12,
    marginTop: 12,
    gap: 0,
  },
  earnTitle: {
    color: C.query,
    fontSize: TY.size_xs,
    letterSpacing: 2,
    marginBottom: 10,
    fontWeight: TY.weight_black,
  },
  earnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: C.card_dark,
  },
  earnLabel: { color: C.text_muted, fontSize: TY.size_note },
  earnVal:   { color: C.query, fontSize: TY.size_sm, fontWeight: TY.weight_heavy },

  versionBlock: {
    alignItems: 'center',
    marginTop: 24,
    gap: 4,
  },
  versionText: { color: C.text_muted, fontSize: TY.size_xs, letterSpacing: 2 },
  versionSub:  { color: C.text_muted, fontSize: TY.size_2xs, letterSpacing: 3, opacity: 0.5 },
})

const meta = StyleSheet.create({
  runRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.bg_deeper,
    borderWidth: 1,
    borderColor: C.divider,
    borderRadius: R.md,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 10,
    gap: 0,
  },
  runStat: { flex: 1, alignItems: 'center', gap: 2 },
  runVal: { color: C.text_muted, fontSize: TY.size_h6, fontWeight: TY.weight_black },
  runLabel: { color: C.text_muted, fontSize: TY.size_2xs, letterSpacing: 1.5, fontWeight: TY.weight_bold },
  runDivider: { width: 1, height: 28, backgroundColor: C.card_dark },
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
    borderRadius: R.md,
    borderWidth: 1,
    borderColor: C.card_dark,
    backgroundColor: C.bg_deeper,
    alignItems: 'center',
  },
  label: { fontSize: TY.size_xs, fontWeight: TY.weight_black, letterSpacing: 1.5 },
})

const row = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: C.text_muted,
  },
  icon: { fontSize: TY.size_lg, width: 26, textAlign: 'center' },
  text: { flex: 1 },
  name: { color: C.text_bright, fontSize: TY.size_body, fontWeight: TY.weight_bold, marginBottom: 2 },
  desc: { color: C.text_muted, fontSize: TY.size_note, lineHeight: 16 },
})
