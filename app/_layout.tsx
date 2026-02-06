import { Stack, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { getForceUpdate, appVersion, versionToNumber } from '../services/forceupdate';
import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync } from '../services/notifications';
import CookieManager from '@react-native-cookies/cookies';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function addTokenToCookie(token: string) {
  CookieManager.set('https://agit.gg', {
    name: 'EXPO_PUSH_TOKEN',
    value: token,
    domain: '.agit.gg',
    path: '/',
  });
}

export default function RootLayout() {
  const { push, replace } = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady) return;

    registerForPushNotificationsAsync()
      .then((token) => {
        if (token) {
          addTokenToCookie(token);
          console.log('Expo Push Token:', token);
        }
      })
      .catch((error: any) => console.error(error));

    const response = Notifications.getLastNotificationResponse();
    if (response?.notification) {
      const data = response.notification.request.content.data.path;
      if (typeof data === 'string') {
        replace(`/webview/${encodeURIComponent(data)}`);
      }
    }

    const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data.path;
      if (typeof data === 'string') {
        replace(`/webview/${encodeURIComponent(data)}`);
      }
    });

    return () => {
      responseListener.remove();
    };
  }, [push, replace, isReady]);

  useEffect(() => {
    const checkVersion = async () => {
      const latest = await getForceUpdate();
      if (latest && appVersion && versionToNumber(latest.version) > versionToNumber(appVersion)) {
        replace('/forceupdate');
      }
    };

    checkVersion();
  }, [replace]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="forceupdate" />
      <Stack.Screen name="webview/[path]" />
    </Stack>
  );
}
