import React, { useState, useEffect } from 'react'
import { StyleSheet, View, BackHandler } from 'react-native'
import { initCrashReporting } from './src/utils/crashReporting'

let MobileAds: any = null
try { MobileAds = require('react-native-google-mobile-ads').default } catch {}
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { useGameStore } from './src/store/useGameStore'
import { useGameLoop } from './src/hooks/useGameLoop'
import { SaveSystem } from './src/domain/SaveSystem'
import { useAudio } from './src/hooks/useAudio'
import { SplashScreen } from './src/screens/SplashScreen'
import { MenuScreen } from './src/screens/MenuScreen'
import { GameScreen } from './src/screens/GameScreen'
import { GameOverScreen } from './src/screens/GameOverScreen'
import { BuildingScreen } from './src/screens/BuildingScreen'
import { SummaryScreen } from './src/screens/SummaryScreen'
import { ErrorBoundary } from './src/components/ErrorBoundary'

type AppScreen = 'splash' | 'menu' | 'game'

export default function App() {
  const [appScreen, setAppScreen] = useState<AppScreen>('splash')
  const [hasResumableGame, setHasResumableGame] = useState(false)
  const game = useGameStore()
  const { startGame, loadSave } = useGameLoop()
  const { playSFX, stopAllSFX, startAmbient } = useAudio()

  useEffect(() => {
    initCrashReporting()
    if (MobileAds) { try { MobileAds().initialize() } catch {} }
    loadSave().then(({ hasResumableGame: resumable }) => setHasResumableGame(resumable))
    startAmbient()
  }, [])

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (appScreen === 'splash') return true   // splash sırasında çıkışı engelle
      if (appScreen === 'menu')   return false  // menüde Android'in normal çıkışına izin ver
      return true  // oyun içinde blokla — GameScreen kendi fazlarını yönetir
    })
    return () => sub.remove()
  }, [appScreen])

  const handleStart = () => {
    startGame()
    setHasResumableGame(false)
    setAppScreen('game')
  }

  const handleResume = () => {
    setAppScreen('game')
  }

  const handleRestart = () => {
    startGame()
    setHasResumableGame(false)
  }

  const handleSaveExit = () => {
    setHasResumableGame(true)
    setAppScreen('menu')
  }

  const handleAbandon = async () => {
    await SaveSystem.clear()
    game.reset()
    setHasResumableGame(false)
    setAppScreen('menu')
  }

  const handleMainMenu = () => {
    game.reset()
    setHasResumableGame(false)
    setAppScreen('menu')
  }

  const renderGame = () => {
    if (game.isGameOver) {
      if (game.gameOverReason === 'victory') {
        return <SummaryScreen onRestart={handleRestart} onMainMenu={handleMainMenu} />
      }
      return <GameOverScreen onRestart={handleRestart} onMainMenu={handleMainMenu} />
    }
    if (game.phase === 'building') return <BuildingScreen onMainMenu={handleMainMenu} />
    return <GameScreen onMainMenu={handleSaveExit} onAbandonGame={handleAbandon} playSFX={playSFX} stopAllSFX={stopAllSFX} />
  }

  return (
    <ErrorBoundary>
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        {appScreen === 'splash' && (
          <View style={StyleSheet.absoluteFillObject}>
            <SplashScreen onDone={() => { setAppScreen('menu') }} />
          </View>
        )}
        {appScreen === 'menu' && (
          <View style={StyleSheet.absoluteFillObject}>
            <MenuScreen onStart={handleStart} onResume={handleResume} hasResumableGame={hasResumableGame} />
          </View>
        )}
        {appScreen === 'game' && (
          <View style={StyleSheet.absoluteFillObject}>
            {renderGame()}
          </View>
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
    </ErrorBoundary>
  )
}
