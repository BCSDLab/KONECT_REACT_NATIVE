import { Stack, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { AppState } from 'react-native';
import { getForceUpdate, appVersion, versionToNumber } from '../services/forceupdate';
import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync, shouldRecheckPermission } from '../services/notifications';
import { storePushToken } from '../utils/pushTokenStore';

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
    let tokenObtained = false;
    // 권한 거부로 토큰 취득 불가한 경우 (네트워크 오류와 구분)
    // registerForPushNotificationsAsync가 undefined를 반환하면 권한 거부
    let permissionDenied = false;

    const handleToken = (token?: string) => {
      if (token) {
        tokenObtained = true;
        permissionDenied = false;
        storePushToken(token);
        console.log('Expo Push Token:', token);
      } else {
        permissionDenied = true;
      }
    };

    registerForPushNotificationsAsync()
      .then(handleToken)
      .catch((error: any) => console.error(error));

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      const fromSettings = shouldRecheckPermission();
      // 설정에서 돌아온 경우: 항상 재시도
      // 권한 거부가 아닌데 토큰이 없는 경우(네트워크 오류 등): 재시도
      // 권한 거부 상태에서 그냥 포그라운드 복귀: 재시도 안 함 (alert 무한 반복 방지)
      if (nextAppState === 'active' && (fromSettings || (!tokenObtained && !permissionDenied))) {
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
      <Stack.Screen name="forceupdate" />
      <Stack.Screen name="webview/[path]" />
    </Stack>
  );
}
