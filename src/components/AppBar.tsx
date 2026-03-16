import React, { useState } from 'react'
import {
  View, Text, TouchableOpacity, Modal,
  StyleSheet, Platform,
} from 'react-native'
import { useSettingsStore } from '../store/useSettingsStore'
import themeData from '../data/theme.json'

const C  = themeData.colors
const TY = themeData.typography
const SP = themeData.spacing
const R  = themeData.radius
const MONO = Platform.select(themeData.ui.font_mono) as string
const DOTS = themeData.ui.terminal_dots

interface AppBarProps {
  onMainMenu?: () => void
}

export const AppBar: React.FC<AppBarProps> = ({ onMainMenu }) => {
  const [settingsVisible, setSettingsVisible] = useState(false)
  const [confirmVisible,  setConfirmVisible]  = useState(false)
  const { soundEnabled, toggleSound } = useSettingsStore()

  const openConfirm = () => {
    setSettingsVisible(false)
    setTimeout(() => setConfirmVisible(true), 320)
  }

  const handleConfirmExit = () => {
    setConfirmVisible(false)
    onMainMenu?.()
  }

  return (
    <>
      <View style={styles.bar}>
        <View style={styles.dots}>
          <View style={[styles.dot, { backgroundColor: DOTS[0] }]} />
          <View style={[styles.dot, { backgroundColor: DOTS[1] }]} />
          <View style={[styles.dot, { backgroundColor: DOTS[2] }]} />
        </View>

        <Text style={[styles.title, { fontFamily: MONO }]}>LAST GATE</Text>

        <TouchableOpacity
          onPress={() => setSettingsVisible(true)}
          style={styles.gearBtn}
          activeOpacity={0.6}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.gearIcon}>⚙</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={settingsVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSettingsVisible(false)}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={() => setSettingsVisible(false)}
        >
          <View style={styles.sheet} onStartShouldSetResponder={() => true}>

            <View style={styles.termHeader}>
              <View style={styles.termDots}>
                <View style={[styles.termDot, { backgroundColor: DOTS[0] }]} />
                <View style={[styles.termDot, { backgroundColor: DOTS[1] }]} />
                <View style={[styles.termDot, { backgroundColor: DOTS[2] }]} />
              </View>
              <Text style={[styles.termTitle, { fontFamily: MONO }]}>AYARLAR</Text>
              <TouchableOpacity
                onPress={() => setSettingsVisible(false)}
                style={styles.closeBtn}
                activeOpacity={0.75}
              >
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.settingRow}>
              <View>
                <Text style={[styles.settingLabel, { fontFamily: MONO }]}>SES SİSTEMİ</Text>
                <Text style={styles.settingSub}>Ortam müziği ve efektler</Text>
              </View>
              <TouchableOpacity
                onPress={toggleSound}
                style={[styles.toggle, {
                  borderColor: soundEnabled ? (C.accept + '66') : (C.text_muted + '66'),
                  backgroundColor: soundEnabled ? '#052e16' : C.bg_deeper,
                }]}
                activeOpacity={0.8}
              >
                <Text style={[styles.toggleText, { color: soundEnabled ? C.accept_glow : C.text_muted }]}>
                  {soundEnabled ? '● AÇIK' : '○ KAPALI'}
                </Text>
              </TouchableOpacity>
            </View>

            {onMainMenu && (
              <TouchableOpacity
                onPress={openConfirm}
                style={styles.menuExitRow}
                activeOpacity={0.8}
              >
                <View>
                  <Text style={[styles.menuExitLabel, { fontFamily: MONO }]}>ANA MENÜYE DÖN</Text>
                  <Text style={styles.menuExitSub}>Mevcut oyun ilerlemen silinir</Text>
                </View>
                <Text style={styles.menuExitArrow}>↩</Text>
              </TouchableOpacity>
            )}

            <Text style={[styles.version, { fontFamily: MONO }]}>LAST GATE  ·  v0.1.0  ·  EARLY ACCESS</Text>

            <TouchableOpacity
              onPress={() => setSettingsVisible(false)}
              style={styles.closeButton}
              activeOpacity={0.8}
            >
              <Text style={[styles.closeButtonText, { fontFamily: MONO }]}>[ KAPAT ]</Text>
            </TouchableOpacity>

          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={confirmVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmVisible(false)}
      >
        <View style={confirm.backdrop}>
          <View style={confirm.box}>

            <View style={confirm.accentBar} />

            <View style={confirm.head}>
              <Text style={confirm.warningIcon}>⚠</Text>
              <Text style={[confirm.title, { fontFamily: MONO }]}>ANA MENÜYE DÖN</Text>
            </View>

            <Text style={confirm.message}>
              Mevcut oyun ilerlemen silinecek.{'\n'}Çıkmak istediğine emin misin?
            </Text>

            <View style={confirm.divider} />

            <View style={confirm.btnRow}>
              <TouchableOpacity
                onPress={() => setConfirmVisible(false)}
                style={[confirm.btn, confirm.btnCancel]}
                activeOpacity={0.8}
              >
                <Text style={[confirm.btnText, confirm.btnCancelText, { fontFamily: MONO }]}>İPTAL</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleConfirmExit}
                style={[confirm.btn, confirm.btnExit]}
                activeOpacity={0.8}
              >
                <Text style={[confirm.btnText, confirm.btnExitText, { fontFamily: MONO }]}>ÇIKIŞ</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  bar: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    backgroundColor: C.bg_deeper,
    borderBottomWidth: 1,
    borderBottomColor: C.danger_dark,
  },
  dots: { flexDirection: 'row', gap: 5, width: 40 },
  dot:  { width: 7, height: 7, borderRadius: R.xs },
  title: {
    flex: 1,
    textAlign: 'center',
    color: C.danger,
    fontSize: TY.size_body,
    fontWeight: TY.weight_black,
    letterSpacing: 5,
  },
  gearBtn:  { width: 40, alignItems: 'flex-end' },
  gearIcon: { fontSize: TY.size_h5, color: C.text_muted },

  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.80)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: C.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderColor: C.card_bg,
    paddingBottom: Platform.OS === 'android' ? 32 : 24,
  },

  termHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: C.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomWidth: 1,
    borderBottomColor: C.card_bg,
  },
  termDots: { flexDirection: 'row', gap: 5 },
  termDot:  { width: 9, height: 9, borderRadius: R.xs },
  termTitle: {
    flex: 1,
    color: C.text_muted,
    fontSize: TY.size_xs,
    fontWeight: TY.weight_heavy,
    letterSpacing: 2.5,
    textAlign: 'center',
  },
  closeBtn: {
    width: 30, height: 30,
    borderRadius: 15,
    backgroundColor: C.card_bg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.divider,
  },
  closeText: { color: C.text_muted, fontSize: TY.size_sm, fontWeight: TY.weight_black },

  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: C.card_dark,
  },
  settingLabel: {
    color: C.text_muted,
    fontSize: TY.size_note,
    fontWeight: TY.weight_heavy,
    letterSpacing: 1.5,
    marginBottom: 3,
  },
  settingSub: { color: C.divider, fontSize: TY.size_note },
  toggle: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: R.md,
    borderWidth: 1,
    minWidth: 90,
    alignItems: 'center',
  },
  toggleText: { fontSize: TY.size_sm, fontWeight: TY.weight_heavy, letterSpacing: 0.5 },

  menuExitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginHorizontal: 18,
    marginTop: 8,
    borderRadius: R.pill,
    borderWidth: 1,
    borderColor: C.border_neg,
    borderLeftWidth: 3,
    borderLeftColor: C.danger_dark,
    backgroundColor: C.danger_dark,
  },
  menuExitLabel: {
    color: C.danger,
    fontSize: TY.size_note,
    fontWeight: TY.weight_heavy,
    letterSpacing: 1.5,
    marginBottom: 3,
  },
  menuExitSub:   { color: C.text_muted, fontSize: TY.size_xs },
  menuExitArrow: { color: C.danger, fontSize: TY.size_h4, fontWeight: TY.weight_black },

  version: {
    color: C.bg_deeper,
    fontSize: TY.size_caption,
    letterSpacing: 1.5,
    textAlign: 'center',
    paddingVertical: 18,
  },
  closeButton: {
    marginHorizontal: 18,
    marginTop: 2,
    paddingVertical: 14,
    borderRadius: R.pill,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.divider,
    alignItems: 'center',
  },
  closeButtonText: {
    color: C.text_muted,
    fontSize: TY.size_note,
    fontWeight: TY.weight_black,
    letterSpacing: 2,
  },
})

const confirm = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  box: {
    width: '100%',
    backgroundColor: C.card_dark,
    borderRadius: R.xl,
    borderWidth: 1,
    borderColor: C.divider,
    overflow: 'hidden',
  },

  accentBar: {
    height: 3,
    backgroundColor: C.danger_dark,
  },

  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  warningIcon: {
    fontSize: TY.size_lg,
    color: C.danger,
  },
  title: {
    color: C.danger,
    fontSize: TY.size_body,
    fontWeight: TY.weight_black,
    letterSpacing: 2,
  },

  message: {
    color: C.text_secondary,
    fontSize: TY.size_body,
    lineHeight: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  divider: {
    height: 1,
    backgroundColor: C.card_bg,
    marginHorizontal: 0,
  },

  btnRow: {
    flexDirection: 'row',
  },
  btn: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCancel: {
    borderRightWidth: 1,
    borderRightColor: C.card_bg,
    backgroundColor: C.bg_deeper,
  },
  btnExit: {
    backgroundColor: C.danger_dark,
  },
  btnText: {
    fontSize: TY.size_sm,
    fontWeight: TY.weight_black,
    letterSpacing: 1.5,
  },
  btnCancelText: { color: C.text_muted },
  btnExitText:   { color: C.danger },
})
