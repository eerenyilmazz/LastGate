const appConfig      = require('./src/data/config.json')
const admobAndroidId = process.env.ADMOB_ANDROID_ID || appConfig.admob_android_app_id
const sentryDsn      = process.env.SENTRY_DSN

const plugins = [
  [
    '@sentry/react-native/expo',
    {
      organization: 'code-vivus',
      project:      'lastgate',
      ...(sentryDsn ? { dsn: sentryDsn } : {}),
    },
  ],
  [
    'react-native-google-mobile-ads',
    { androidAppId: admobAndroidId },
  ],
]

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
      orientation: 'portrait',
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
