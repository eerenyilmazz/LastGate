import React from 'react'
import { StyleSheet, Text } from 'react-native'
import { GestureDetector, Gesture } from 'react-native-gesture-handler'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
  SharedValue,
} from 'react-native-reanimated'
import { useTheme } from '../../hooks/useTheme'
import themeData from '../../data/theme.json'
const TC = themeData.colors
const C  = TC
const TY = themeData.typography as any
const R  = themeData.radius

interface Props {
  children: React.ReactNode
  onSwipeRight: () => void
  onSwipeLeft:  () => void
  onSwipeUp:    () => void
  disabled?:    boolean
  dragX?: SharedValue<number>
  dragY?: SharedValue<number>
}

const SwipeHandlerInner: React.FC<Props> = ({
  children,
  onSwipeRight,
  onSwipeLeft,
  onSwipeUp,
  disabled = false,
  dragX,
  dragY,
}) => {
  const theme    = useTheme()
  const C        = theme.colors
  const THRESHOLD = theme.animation.swipe_threshold
  const DURATION  = theme.animation.swipe_duration_ms

  const translateX = useSharedValue(0)
  const translateY = useSharedValue(0)
  const rotation   = useSharedValue(0)
  const opacity    = useSharedValue(1)

  const gesture = Gesture.Pan()
    .enabled(!disabled)
    .onUpdate(e => {
      'worklet'
      translateX.value = e.translationX
      translateY.value = e.translationY * 0.3
      rotation.value   = e.translationX * 0.06
      if (dragX) dragX.value = e.translationX
      if (dragY) dragY.value = e.translationY
    })
    .onEnd(e => {
      'worklet'
      if (e.translationX > THRESHOLD) {
        translateX.value = withTiming(500, { duration: DURATION })
        opacity.value    = withTiming(0,   { duration: DURATION }, () => {
          'worklet'
          runOnJS(onSwipeRight)()
        })
        if (dragX) dragX.value = withTiming(0, { duration: DURATION })

      } else if (e.translationX < -THRESHOLD) {
        translateX.value = withTiming(-500, { duration: DURATION })
        opacity.value    = withTiming(0,    { duration: DURATION }, () => {
          'worklet'
          runOnJS(onSwipeLeft)()
        })
        if (dragX) dragX.value = withTiming(0, { duration: DURATION })

      } else if (e.translationY < -THRESHOLD) {
        translateX.value = withSpring(0)
        translateY.value = withSpring(0)
        rotation.value   = withSpring(0)
        if (dragX) dragX.value = withSpring(0)
        if (dragY) dragY.value = withSpring(0)
        runOnJS(onSwipeUp)()

      } else {
        translateX.value = withSpring(0)
        translateY.value = withSpring(0)
        rotation.value   = withSpring(0)
        if (dragX) dragX.value = withSpring(0)
        if (dragY) dragY.value = withSpring(0)
      }
    })

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotation.value}deg` },
    ],
    opacity: opacity.value,
  }))

  const acceptLabelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [20, THRESHOLD], [0, 1], Extrapolation.CLAMP),
  }))
  const rejectLabelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-20, -THRESHOLD], [0, 1], Extrapolation.CLAMP),
  }))
  const queryLabelStyle  = useAnimatedStyle(() => ({
    opacity: interpolate(translateY.value, [-20, -THRESHOLD * 0.3], [0, 1], Extrapolation.CLAMP),
  }))

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={animStyle} pointerEvents={disabled ? 'none' : 'auto'}>
        {children}

        <Animated.View style={[styles.dirLabel, styles.acceptLabel, acceptLabelStyle]}>
          <Text style={[styles.dirText, { color: C.accept_glow }]}>KABUL ✓</Text>
        </Animated.View>

        <Animated.View style={[styles.dirLabel, styles.rejectLabel, rejectLabelStyle]}>
          <Text style={[styles.dirText, { color: C.reject_glow }]}>✕ RET</Text>
        </Animated.View>

        <Animated.View style={[styles.dirLabel, styles.queryLabel, queryLabelStyle]}>
          <Text style={[styles.dirText, { color: C.query }]}>SORGU ↑</Text>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  )
}

export const SwipeHandler = React.memo(SwipeHandlerInner)

const styles = StyleSheet.create({
  dirLabel: {
    position: 'absolute',
    top: 60,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: R.sm,
    borderWidth: 2,
  },
  acceptLabel: { right: 16, borderColor: TC.accept_glow, backgroundColor: TC.accept_glow + '22' },
  rejectLabel: { left: 16,  borderColor: TC.reject_glow, backgroundColor: TC.reject_glow + '22' },
  queryLabel:  {
    alignSelf: 'center',
    left: '30%',
    borderColor: C.query,
    backgroundColor: (C.query + '22'),
  },
  dirText: { fontWeight: TY.weight_black, fontSize: TY.size_md, letterSpacing: 1 },
})
