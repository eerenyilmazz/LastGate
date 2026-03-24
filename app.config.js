// app.config.js — dynamic config (replaces app.json)
// AdMob IDs are read from environment variables.
// Set ADMOB_ANDROID_ID and ADMOB_IOS_ID in your .env or EAS secrets.

const admobAndroidId = process.env.ADMOB_ANDROID_ID
const admobIosId     = process.env.ADMOB_IOS_ID

const plugins = []
if (admobAndroidId && admobIosId) {
  plugins.push([
    'react-native-google-mobile-ads',
    { androidAppId: admobAndroidId, iosAppId: admobIosId },
  ])
}

module.exports = {
  expo: {
    name: 'LastGate',
    slug: 'LastGate',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#0d0d0d',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.eerenyilmazz.lastgate',
      jsEngine: 'hermes',
    },
    android: {
      jsEngine: 'hermes',
      adaptiveIcon: {
        backgroundColor: '#0a0a0a',
        foregroundImage: './assets/android-icon-foreground.png',
        backgroundImage: './assets/android-icon-background.png',
        monochromeImage: './assets/android-icon-monochrome.png',
      },
      predictiveBackGestureEnabled: false,
      package: 'com.eerenyilmazz.lastgate',
    },
    web: {
      favicon: './assets/favicon.png',
    },
    extra: {
      eas: {
        projectId: 'b2998590-3bfc-4ffd-928a-cc58365fa9e0',
      },
    },
    plugins,
  },
}
