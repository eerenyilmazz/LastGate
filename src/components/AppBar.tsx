import React, { useState } from 'react'
import {
  View, Text, TouchableOpacity, Modal,
  StyleSheet, Platform,
} from 'react-native'
import { useSettingsStore } from '../store/useSettingsStore'
import themeData from '../data/theme.json'
import uiData from '../data/ui.json'
import config from '../data/config.json'

const C  = themeData.colors
const TY = themeData.typography as any
const SP = themeData.spacing
const R  = themeData.radius
const MONO = Platform.select(themeData.ui.font_mono) as string
const DOTS = themeData.ui.terminal_dots
const STRINGS = (uiData as any).strings as Record<string, string>

interface AppBarProps {
  onMainMenu?:    () => void
  onAbandonGame?: () => void
}

export const AppBar: React.FC<AppBarProps> = ({ onMainMenu, onAbandonGame }) => {
  const [settingsVisible, setSettingsVisible] = useState(false)
  const [confirmVisible,  setConfirmVisible]  = useState(false)
  const { musicEnabled, sfxEnabled, toggleMusic, toggleSfx } = useSettingsStore()

  const openConfirm = () => {
    setSettingsVisible(false)
    setTimeout(() => setConfirmVisible(true), 320)
  }

  const handleConfirmExit = () => {
    setConfirmVisible(false)
    onMainMenu?.()
  }

  const handleConfirmAbandon = () => {
    setConfirmVisible(false)
    onAbandonGame?.()
  }

  return (
    <>
      <View style={styles.bar}>
        <View style={styles.dots}>
          <View style={[styles.dot, { backgroundColor: DOTS[0] }]} />
          <View style={[styles.dot, { backgroundColor: DOTS[1] }]} />
          <View style={[styles.dot, { backgroundColor: DOTS[2] }]} />
        </View>

        <Text style={[styles.title, { fontFamily: MONO }]}>{STRINGS.appbar_title}</Text>

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
              <Text style={[styles.termTitle, { fontFamily: MONO }]}>{STRINGS.appbar_settings}</Text>
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
                <Text style={[styles.settingLabel, { fontFamily: MONO }]}>{STRINGS.appbar_music_label}</Text>
                <Text style={styles.settingSub}>{STRINGS.appbar_music_desc}</Text>
              </View>
              <TouchableOpacity
                onPress={toggleMusic}
                style={[styles.toggle, {
                  borderColor: musicEnabled ? (C.accept + '66') : (C.text_muted + '66'),
                  backgroundColor: musicEnabled ? C.toggle_on_bg : C.bg_deeper,
                }]}
                activeOpacity={0.8}
              >
                <Text style={[styles.toggleText, { color: musicEnabled ? C.accept_glow : C.text_muted }]}>
                  {musicEnabled ? STRINGS.appbar_toggle_on : STRINGS.appbar_toggle_off}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.settingRow}>
              <View>
                <Text style={[styles.settingLabel, { fontFamily: MONO }]}>{STRINGS.appbar_sfx_label}</Text>
                <Text style={styles.settingSub}>{STRINGS.appbar_sfx_desc}</Text>
              </View>
              <TouchableOpacity
                onPress={toggleSfx}
                style={[styles.toggle, {
                  borderColor: sfxEnabled ? (C.accept + '66') : (C.text_muted + '66'),
                  backgroundColor: sfxEnabled ? C.toggle_on_bg : C.bg_deeper,
                }]}
                activeOpacity={0.8}
              >
                <Text style={[styles.toggleText, { color: sfxEnabled ? C.accept_glow : C.text_muted }]}>
                  {sfxEnabled ? STRINGS.appbar_toggle_on : STRINGS.appbar_toggle_off}
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
                  <Text style={[styles.menuExitLabel, { fontFamily: MONO }]}>{STRINGS.appbar_back}</Text>
                  <Text style={styles.menuExitSub}>{STRINGS.appbar_back_desc}</Text>
                </View>
                <Text style={styles.menuExitArrow}>↩</Text>
              </TouchableOpacity>
            )}

            <Text style={[styles.version, { fontFamily: MONO }]}>{STRINGS.appbar_version.replace('{version}', (config as any).app_version)}</Text>

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
              <Text style={[confirm.title, { fontFamily: MONO }]}>{STRINGS.appbar_confirm_back}</Text>
            </View>

            <View style={confirm.divider} />

            <TouchableOpacity
              onPress={handleConfirmExit}
              style={[confirm.btn, confirm.btnExit, { marginBottom: 8 }]}
              activeOpacity={0.8}
            >
              <Text style={[confirm.btnText, confirm.btnExitText, { fontFamily: MONO }]}>KAYDET & ÇIK</Text>
            </TouchableOpacity>

            {onAbandonGame && (
              <TouchableOpacity
                onPress={handleConfirmAbandon}
                style={[confirm.btn, confirm.btnAbandon]}
                activeOpacity={0.8}
              >
                <Text style={[confirm.btnText, confirm.btnAbandonText, { fontFamily: MONO }]}>BIRAK & ÇIK</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={() => setConfirmVisible(false)}
              style={[confirm.btn, confirm.btnCancel, { marginTop: 4 }]}
              activeOpacity={0.8}
            >
              <Text style={[confirm.btnText, confirm.btnCancelText, { fontFamily: MONO }]}>{STRINGS.appbar_cancel}</Text>
            </TouchableOpacity>

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
    color: C.accept_glow,
    fontSize: TY.size_body,
    fontWeight: TY.weight_black,
    letterSpacing: 5,
  },
  gearBtn:  { width: 40, alignItems: 'flex-end' },
  gearIcon: { fontSize: TY.size_h5, color: C.text_muted },

  backdrop: {
    flex: 1,
    backgroundColor: C.overlay_backdrop_deep,
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

  btn: {
    width: '100%',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: R.sm,
  },
  btnCancel: {
    backgroundColor: 'transparent',
  },
  btnExit: {
    backgroundColor: C.accept + '22',
    borderWidth: 1,
    borderColor: C.accept + '44',
  },
  btnAbandon: {
    backgroundColor: C.danger_dark,
    borderWidth: 1,
    borderColor: C.danger + '44',
  },
  btnText: {
    fontSize: TY.size_sm,
    fontWeight: TY.weight_black,
    letterSpacing: 1.5,
  },
  btnCancelText:  { color: C.text_muted },
  btnExitText:    { color: C.accept_glow },
  btnAbandonText: { color: C.danger },
})
