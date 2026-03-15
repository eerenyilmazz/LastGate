import React, { useState } from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import Animated, { FadeIn } from 'react-native-reanimated'
import { useGameStore } from './src/store/useGameStore'
import { useGameLoop } from './src/hooks/useGameLoop'
import { useAudio } from './src/hooks/useAudio'
import { SplashScreen } from './src/screens/SplashScreen'
import { MenuScreen } from './src/screens/MenuScreen'
import { GameScreen } from './src/screens/GameScreen'
import { GameOverScreen } from './src/screens/GameOverScreen'
import { BuildingScreen } from './src/screens/BuildingScreen'
import { SummaryScreen } from './src/screens/SummaryScreen'

type AppScreen = 'splash' | 'menu' | 'game'

export default function App() {
  const [appScreen, setAppScreen] = useState<AppScreen>('splash')
  const game = useGameStore()
  const { startGame } = useGameLoop()
  const { playSFX, startAmbient } = useAudio()

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
    return <GameScreen onMainMenu={handleMainMenu} playSFX={playSFX} />
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        {appScreen === 'splash' && (
          <Animated.View key="splash" entering={FadeIn.duration(400)} style={{ flex: 1 }}>
            <SplashScreen onDone={() => { startAmbient(); setAppScreen('menu') }} />
          </Animated.View>
        )}
        {appScreen === 'menu' && (
          <Animated.View key="menu" entering={FadeIn.duration(350)} style={{ flex: 1 }}>
            <MenuScreen onStart={handleStart} />
          </Animated.View>
        )}
        {appScreen === 'game' && (
          <Animated.View key="game" entering={FadeIn.duration(300)} style={{ flex: 1 }}>
            {renderGame()}
          </Animated.View>
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
