import React, { useState } from 'react'
import {
  View, Text, TouchableOpacity, Modal,
  StyleSheet, Platform,
} from 'react-native'
import { useSettingsStore } from '../store/useSettingsStore'
import themeData from '../data/theme.json'

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
                  borderColor: soundEnabled ? '#2e7d3266' : '#33333366',
                  backgroundColor: soundEnabled ? '#052e16' : '#111',
                }]}
                activeOpacity={0.8}
              >
                <Text style={[styles.toggleText, { color: soundEnabled ? '#4ade80' : '#555' }]}>
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
    backgroundColor: '#0a0704',
    borderBottomWidth: 1,
    borderBottomColor: '#200000',
  },
  dots: { flexDirection: 'row', gap: 5, width: 40 },
  dot:  { width: 7, height: 7, borderRadius: 4 },
  title: {
    flex: 1,
    textAlign: 'center',
    color: '#cc2222',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 5,
  },
  gearBtn:  { width: 40, alignItems: 'flex-end' },
  gearIcon: { fontSize: 20, color: '#555' },

  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.80)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#111827',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderColor: '#2d3748',
    paddingBottom: Platform.OS === 'android' ? 32 : 24,
  },

  termHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: '#1f2937',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2d3748',
  },
  termDots: { flexDirection: 'row', gap: 5 },
  termDot:  { width: 9, height: 9, borderRadius: 5 },
  termTitle: {
    flex: 1,
    color: '#6b7280',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2.5,
    textAlign: 'center',
  },
  closeBtn: {
    width: 30, height: 30,
    borderRadius: 15,
    backgroundColor: '#252d3d',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#374151',
  },
  closeText: { color: '#555', fontSize: 12, fontWeight: '900' },

  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#160f08',
  },
  settingLabel: {
    color: '#666',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 3,
  },
  settingSub: { color: '#374151', fontSize: 11 },
  toggle: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 90,
    alignItems: 'center',
  },
  toggleText: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },

  menuExitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginHorizontal: 18,
    marginTop: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3d1010',
    borderLeftWidth: 3,
    borderLeftColor: '#8b0000',
    backgroundColor: '#1e0808',
  },
  menuExitLabel: {
    color: '#cc3333',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 3,
  },
  menuExitSub:   { color: '#6a3535', fontSize: 10 },
  menuExitArrow: { color: '#cc2222', fontSize: 22, fontWeight: '900' },

  version: {
    color: '#1e1e1e',
    fontSize: 9,
    letterSpacing: 1.5,
    textAlign: 'center',
    paddingVertical: 18,
  },
  closeButton: {
    marginHorizontal: 18,
    marginTop: 2,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#1f2937',
    borderWidth: 1,
    borderColor: '#374151',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#6b7280',
    fontSize: 11,
    fontWeight: '900',
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
    backgroundColor: '#0e0b08',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2a1e14',
    overflow: 'hidden',
  },

  accentBar: {
    height: 3,
    backgroundColor: '#8b0000',
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
    fontSize: 18,
    color: '#cc2222',
  },
  title: {
    color: '#cc3333',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 2,
  },

  message: {
    color: '#6a5a4a',
    fontSize: 13,
    lineHeight: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  divider: {
    height: 1,
    backgroundColor: '#2d3748',
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
    borderRightColor: '#2d3748',
    backgroundColor: '#120f0b',
  },
  btnExit: {
    backgroundColor: '#1e0808',
  },
  btnText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  btnCancelText: { color: '#5a4a38' },
  btnExitText:   { color: '#cc3333' },
})
