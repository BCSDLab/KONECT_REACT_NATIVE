import { Stack, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { AppState } from 'react-native';
import { getForceUpdate, appVersion, versionToNumber } from '../services/forceupdate';
import * as Notifications from 'expo-notifications';
import {
  registerForPushNotificationsAsync,
  shouldRecheckPermission,
} from '../services/notifications';
import { storePushToken, initPushTokenStore } from '../utils/pushTokenStore';
import { getAccessToken } from '../services/nativeAuthStore';
import { registerPushToken } from '../services/pushTokenApi';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function RootLayout() {
  const { replace } = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(true);
  }, []);

  useEffect(() => {
    initPushTokenStore();
  }, []);

  useEffect(() => {
    let tokenObtained = false;
    let permissionDenied = false;

    const handleToken = async (token?: string) => {
      if (token) {
        tokenObtained = true;
        permissionDenied = false;
        await storePushToken(token);
        console.log('Expo Push Token:', token);

        const accessToken = await getAccessToken();
        if (accessToken) {
          registerPushToken(token).catch((e) => console.error('자동 푸시 토큰 등록 실패:', e));
        }
      } else {
        permissionDenied = true;
      }
    };

    registerForPushNotificationsAsync()
      .then(handleToken)
      .catch((error: any) => console.error(error));

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState !== 'active') return;

      const fromSettings = shouldRecheckPermission();
      if (fromSettings || (!tokenObtained && !permissionDenied)) {
        registerForPushNotificationsAsync()
          .then(handleToken)
          .catch((error: any) => console.error(error));
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (!isReady) return;

    const handleNotificationResponse = (
      response: Notifications.NotificationResponse | null | undefined,
    ) => {
      const path = response?.notification.request.content.data?.path;
      if (typeof path === 'string') {
        replace(`/webview/${encodeURIComponent(path)}`);
      }
    };

    handleNotificationResponse(Notifications.getLastNotificationResponse());

    const responseListener =
      Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);

    return () => {
      responseListener.remove();
    };
  }, [replace, isReady]);

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
      <Stack.Screen name="forceupdate" options={{ gestureEnabled: false }} />
      <Stack.Screen name="webview/[path]" />
    </Stack>
  );
}
