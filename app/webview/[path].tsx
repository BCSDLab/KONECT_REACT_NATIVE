import { useRef, useEffect, useCallback, useState } from 'react';
import {
  BackHandler,
  Platform,
  StatusBar,
  StyleSheet,
  Linking,
  Alert,
  AppState,
  AppStateStatus,
} from 'react-native';
import { Slot, Stack, useLocalSearchParams } from 'expo-router';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import CookieManager from '@preeternal/react-native-cookie-manager';
import * as WebBrowser from 'expo-web-browser';
import { generateUserAgent } from '../../utils/userAgent';
import { appVersion } from '../../services/forceupdate';
import { ShouldStartLoadRequest } from 'react-native-webview/lib/WebViewTypes';
import { webUrl } from '../../constants/constants';
import { getStoredToken } from '../../utils/pushTokenStore';
import { saveAccessToken, clearAccessToken } from '../../services/nativeAuthStore';
import { registerPushToken, unregisterPushToken } from '../../services/pushTokenApi';
import { disableTimerDisplayMode, enableTimerDisplayMode } from '../../services/timerDisplayMode';

const ALLOWED_URL_SCHEMES = ['kakaotalk', 'nidlogin'];
const ALLOWED_ORIGINS = [new URL(webUrl).origin];
const NATIVE_BACK_REQUEST_EVENT = 'KONECT_NATIVE_BACK_REQUEST';

const userAgent = generateUserAgent();

type NativeBridgeMessage =
  | { type: 'LOGIN_COMPLETE'; accessToken?: string }
  | { type: 'TOKEN_REFRESH'; accessToken?: string }
  | { type: 'LOGOUT' }
  | { type: 'TIMER_ACTIVE'; keepAwake?: boolean; dimScreen?: boolean; brightnessLevel?: number }
  | { type: 'TIMER_INACTIVE' }
  | { type: 'NAVIGATE_BACK' };

interface TimerDisplayModeState {
  brightnessLevel?: number;
  dimScreen: boolean;
  isActive: boolean;
  keepAwake: boolean;
}

const injectedJavaScript = `
  (function () {
    const allowedOrigins = ${JSON.stringify(ALLOWED_ORIGINS)};
    if (allowedOrigins.includes(window.location.origin)) {
      window.APP_VERSION = ${JSON.stringify(appVersion ?? '0.0.0')};
    }
  })();
  true;
`;

const handleOnShouldStartLoadWithRequest = ({ url }: ShouldStartLoadRequest) => {
  if (/^https?:\/\//i.test(url)) return true;
  if (url === 'about:blank') return false;
  (async () => {
    try {
      const scheme = url.split(':')[0]?.toLowerCase();
      if ((await Linking.canOpenURL(url)) || ALLOWED_URL_SCHEMES.includes(scheme)) {
        await Linking.openURL(url);
      } else {
        Alert.alert('앱이 설치되지 않았습니다.');
      }
    } catch (e) {
      console.error(e);
    }
  })();
  return false;
};

export default function Index() {
  const webViewRef = useRef<WebView>(null);
  const canGoBackRef = useRef(false);
  const timerDisplayModeRef = useRef<TimerDisplayModeState>({
    brightnessLevel: undefined,
    isActive: false,
    keepAwake: true,
    dimScreen: true,
  });
  const local = useLocalSearchParams();
  const [isTimerActive, setIsTimerActive] = useState(false);

  const requestWebBackConfirmation = useCallback(() => {
    webViewRef.current?.injectJavaScript(
      `window.dispatchEvent(new Event(${JSON.stringify(NATIVE_BACK_REQUEST_EVENT)}));true;`
    );
  }, []);

  const handleMessage = useCallback(async (event: WebViewMessageEvent) => {
    let messageOrigin: string;
    try {
      messageOrigin = new URL(event.nativeEvent.url).origin;
    } catch {
      return;
    }

    if (!ALLOWED_ORIGINS.includes(messageOrigin)) {
      return;
    }

    try {
      const data: NativeBridgeMessage = JSON.parse(event.nativeEvent.data);
      const { type } = data;

      if (type === 'LOGIN_COMPLETE') {
        const { accessToken } = data;
        if (!accessToken) return;

        await saveAccessToken(accessToken);
        console.log('LOGIN_COMPLETE: accessToken 저장 완료');

        const pushToken = getStoredToken();
        if (pushToken) {
          try {
            await registerPushToken(pushToken);
            console.log('푸시 토큰 백엔드 등록 완료');
            webViewRef.current?.injectJavaScript(
              `window.dispatchEvent(new CustomEvent('NOTIFICATION_STATUS', { detail: { registered: true } }));true;`
            );
          } catch (e) {
            console.error('푸시 토큰 등록 실패:', e);
            webViewRef.current?.injectJavaScript(
              `window.dispatchEvent(new CustomEvent('NOTIFICATION_STATUS', { detail: { registered: false } }));true;`
            );
          }
        }
      } else if (type === 'TOKEN_REFRESH') {
        const { accessToken } = data;
        if (accessToken) {
          await saveAccessToken(accessToken);
          console.log('TOKEN_REFRESH: accessToken 갱신 완료');
        }
      } else if (type === 'LOGOUT') {
        const pushToken = getStoredToken();
        if (pushToken) {
          try {
            await unregisterPushToken(pushToken);
            console.log('푸시 토큰 백엔드 삭제 완료');
          } catch (e) {
            console.error('푸시 토큰 삭제 실패:', e);
          }
        }
        await clearAccessToken();
        console.log('LOGOUT: accessToken 삭제 완료');
      } else if (type === 'TIMER_ACTIVE') {
        const keepAwake = data.keepAwake !== false;
        const dimScreen = data.dimScreen !== false;
        const brightnessLevel = data.brightnessLevel;

        timerDisplayModeRef.current = {
          brightnessLevel,
          isActive: true,
          keepAwake,
          dimScreen,
        };
        setIsTimerActive(true);

        await enableTimerDisplayMode({ keepAwake, dimScreen, brightnessLevel });
      } else if (type === 'TIMER_INACTIVE') {
        timerDisplayModeRef.current = {
          ...timerDisplayModeRef.current,
          isActive: false,
        };
        setIsTimerActive(false);

        await disableTimerDisplayMode();
      } else if (type === 'NAVIGATE_BACK') {
        if (webViewRef.current && canGoBackRef.current) {
          webViewRef.current.goBack();
          return;
        }

        if (Platform.OS === 'android') {
          BackHandler.exitApp();
        }
      }
    } catch {
      // JSON 파싱 실패 등 무시
    }
  }, []);

  useEffect(() => {
    if (Platform.OS === 'android') {
      const onBackPress = () => {
        if (timerDisplayModeRef.current.isActive) {
          requestWebBackConfirmation();
          return true;
        }

        if (webViewRef.current && canGoBackRef.current) {
          webViewRef.current.goBack();
          return true;
        }
        return false;
      };
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }
  }, [requestWebBackConfirmation]);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        CookieManager.flush();
        void disableTimerDisplayMode();
        return;
      }

      if (nextAppState === 'active' && timerDisplayModeRef.current.isActive) {
        void enableTimerDisplayMode({
          brightnessLevel: timerDisplayModeRef.current.brightnessLevel,
          keepAwake: timerDisplayModeRef.current.keepAwake,
          dimScreen: timerDisplayModeRef.current.dimScreen,
        });
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
      void disableTimerDisplayMode();
    };
  }, []);

  if (Platform.OS === 'web') {
    return <Slot />;
  }

  return (
    <>
      <Stack.Screen options={{ gestureEnabled: Platform.OS === 'ios' ? !isTimerActive : true }} />
      <SafeAreaView
        style={styles.container}
        edges={Platform.OS === 'ios' ? ['top', 'left', 'right'] : undefined}
      >
        <StatusBar barStyle={'dark-content'} />
        <WebView
          ref={webViewRef}
          onNavigationStateChange={(navState) => {
            canGoBackRef.current = navState.canGoBack;
          }}
          source={{ uri: `${webUrl}/${local.path ?? ''}` }}
          style={styles.webview}
          javaScriptEnabled
          domStorageEnabled
          thirdPartyCookiesEnabled={true}
          sharedCookiesEnabled={true}
          userAgent={userAgent}
          hideKeyboardAccessoryView={Platform.OS === 'ios'}
          injectedJavaScript={injectedJavaScript}
          onShouldStartLoadWithRequest={handleOnShouldStartLoadWithRequest}
          setSupportMultipleWindows
          onOpenWindow={(event) => {
            WebBrowser.openBrowserAsync(event.nativeEvent.targetUrl);
          }}
          originWhitelist={['*']}
          startInLoadingState
          onMessage={handleMessage}
        />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  webview: {
    flex: 1,
  },
});
