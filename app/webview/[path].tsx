import { useRef, useEffect, useCallback } from 'react';
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
import { Slot, useLocalSearchParams } from 'expo-router';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import CookieManager from '@react-native-cookies/cookies';
import * as WebBrowser from 'expo-web-browser';
import { generateUserAgent } from '../../utils/userAgent';
import { ShouldStartLoadRequest } from 'react-native-webview/lib/WebViewTypes';
import { webUrl } from '../../constants/constants';
import { getStoredToken } from '../../utils/pushTokenStore';
import { saveAccessToken, clearAccessToken } from '../../services/nativeAuthStore';
import { registerPushToken, unregisterPushToken } from '../../services/pushTokenApi';

const ALLOWED_URL_SCHEMES = ['kakaotalk', 'nidlogin'];
const ALLOWED_ORIGINS = [new URL(webUrl).origin];

const userAgent = generateUserAgent();

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
  const local = useLocalSearchParams();

  const handleMessage = useCallback(async (event: WebViewMessageEvent) => {
    const origin = event.nativeEvent.url;
    if (!origin || !ALLOWED_ORIGINS.some((allowed) => origin.startsWith(allowed))) {
      return;
    }

    try {
      const data = JSON.parse(event.nativeEvent.data);
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
      }
    } catch {
      // JSON 파싱 실패 등 무시
    }
  }, []);

  useEffect(() => {
    if (Platform.OS === 'android') {
      const onBackPress = () => {
        if (webViewRef.current && canGoBackRef.current) {
          webViewRef.current.goBack();
          return true;
        }
        return false;
      };
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }
  }, []);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        CookieManager.flush();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);

  if (Platform.OS === 'web') {
    return <Slot />;
  }

  return (
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
