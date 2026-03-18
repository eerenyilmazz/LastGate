import React, { useState, useEffect } from 'react'
import { StyleSheet, View } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { useGameStore } from './src/store/useGameStore'
import { useGameLoop } from './src/hooks/useGameLoop'
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
  const game = useGameStore()
  const { startGame, loadSave } = useGameLoop()
  const { playSFX, stopAllSFX, startAmbient } = useAudio()

  useEffect(() => {
    loadSave()
  }, [])

  const handleStart = () => {
    startGame()
    setAppScreen('game')
  }

  const handleRestart = () => {
    startGame()
  }

  const handleMainMenu = () => {
    game.reset()
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
    return <GameScreen onMainMenu={handleMainMenu} playSFX={playSFX} stopAllSFX={stopAllSFX} />
  }

  return (
    <ErrorBoundary>
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        {appScreen === 'splash' && (
          <View style={StyleSheet.absoluteFillObject}>
            <SplashScreen onDone={() => { startAmbient(); setAppScreen('menu') }} />
          </View>
        )}
        {appScreen === 'menu' && (
          <View style={StyleSheet.absoluteFillObject}>
            <MenuScreen onStart={handleStart} />
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
