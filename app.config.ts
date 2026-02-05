import { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'KONECT',
  slug: 'konect-react-native',
  version: '1.0.1',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'konect',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  jsEngine: 'hermes',
  ios: {
    supportsTablet: true,
    usesAppleSignIn: true,
    bundleIdentifier: 'com.bcsdlab.konect',
    buildNumber: '5',
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    versionCode: 11,
    package: 'com.bcsdlab.konect',
    googleServicesFile: './google-services.json',
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
