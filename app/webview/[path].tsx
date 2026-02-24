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
import { Slot, useLocalSearchParams } from 'expo-router';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import CookieManager from '@react-native-cookies/cookies';
import { generateUserAgent } from '../../utils/userAgent';
import { ShouldStartLoadRequest } from 'react-native-webview/lib/WebViewTypes';
import { webUrl } from '../../constants/constants';
import { onPushToken, getStoredToken } from '../../utils/pushTokenStore';

const ALLOWED_URL_SCHEMES = ['kakaotalk', 'nidlogin'];

function buildPushTokenScript(token: string): string {
  const safeToken = JSON.stringify(token);
  return `(function(){window.dispatchEvent(new MessageEvent('message',{data:JSON.stringify({type:'PUSH_TOKEN',token:${safeToken}})}));}());true;`;
}
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
  const pageLoadedRef = useRef(false);
  const [pushToken, setPushToken] = useState<string | null>(getStoredToken);
  const local = useLocalSearchParams();

  useEffect(() => {
    return onPushToken(setPushToken);
  }, []);

  const injectPushToken = useCallback((token: string) => {
    webViewRef.current?.injectJavaScript(buildPushTokenScript(token));
  }, []);

  // 페이지 로드 후 토큰이 도착한 경우 직접 주입
  useEffect(() => {
    if (pushToken && pageLoadedRef.current) {
      injectPushToken(pushToken);
    }
  }, [pushToken, injectPushToken]);

  const handleLoadEnd = useCallback(() => {
    pageLoadedRef.current = true;
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
    <SafeAreaView style={styles.container}>
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
        originWhitelist={['*']}
        startInLoadingState
        onLoadEnd={handleLoadEnd}
        injectedJavaScript={pushToken ? buildPushTokenScript(pushToken) : undefined}
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
