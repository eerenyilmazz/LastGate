import { Dimensions, PixelRatio } from 'react-native'

const BASE_WIDTH  = 375
const BASE_HEIGHT = 812

const { width: W, height: H } = Dimensions.get('window')

export const sw = W
export const sh = H

export const s  = (n: number) => Math.round(n * (W / BASE_WIDTH))
export const vs = (n: number) => Math.round(n * (H / BASE_HEIGHT))
export const ms = (n: number, f = 0.45) => Math.round(n + (s(n) - n) * f)
export const fs = (n: number) => Math.round(PixelRatio.roundToNearestPixel(n * (W / BASE_WIDTH)))
