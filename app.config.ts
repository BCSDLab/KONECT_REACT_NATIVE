import { ExpoConfig } from 'expo/config';

const APP_ENV = process.env.EXPO_PUBLIC_APP_ENV || 'production';
const API_ENV = process.env.EXPO_PUBLIC_API_ENV || APP_ENV;
const appName =
  APP_ENV === 'development' ? 'KONECT D' : API_ENV === 'development' ? 'KONECT S' : 'KONECT';
const packageName = APP_ENV === 'development' ? 'com.bcsdlab.konect.dev' : 'com.bcsdlab.konect';
const googleServicesFile =
  APP_ENV === 'development' ? './google-services-debug.json' : './google-services.json';

const config: ExpoConfig = {
  name: appName,
  slug: 'konect-react-native',
  version: '1.0.6',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'konect',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  jsEngine: 'hermes',
  ios: {
    supportsTablet: true,
    usesAppleSignIn: true,
    bundleIdentifier: packageName,
    buildNumber: '1010603',
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    versionCode: 1010600,
    package: packageName,
    googleServicesFile: googleServicesFile,
  },
  plugins: [
    [
      'expo-build-properties',
      {
        android: {
          kotlinVersion: '2.0.21',
          compileSdkVersion: 35,
          targetSdkVersion: 35,
          buildToolsVersion: '35.0.0',
        },
      },
    ],
    'expo-router',
    [
      'expo-splash-screen',
      {
        image: './assets/images/splash.png',
        resizeMode: 'cover',
        backgroundColor: '#69D3E0',
      },
    ],
    'expo-font',
    'expo-apple-authentication',
    [
      'expo-secure-store',
      {
        faceIDPermission: 'Allow KONECT to access your Face ID biometric data.',
      },
    ],
    'expo-notifications',
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    eas: {
      projectId: '266175da-4a8a-414d-92a5-4547c86abb32',
    },
  },
  owner: 'bcsd',
};

export default config;
