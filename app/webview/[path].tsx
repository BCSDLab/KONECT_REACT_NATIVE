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
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import CookieManager from '@react-native-cookies/cookies';
import { generateUserAgent } from '../../utils/userAgent';
import { ShouldStartLoadRequest } from 'react-native-webview/lib/WebViewTypes';
import { webUrl } from '../../constants/constants';
import { onPushToken } from '../../utils/pushTokenStore';

const ALLOWED_URL_SCHEMES = ['kakaotalk', 'nidlogin'];
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
  const pendingTokenRef = useRef<string | null>(null);
  const local = useLocalSearchParams();

  const injectPushToken = useCallback((token: string) => {
    const safeToken = JSON.stringify(token);
    webViewRef.current?.injectJavaScript(`
      window.dispatchEvent(new MessageEvent('message', {
        data: JSON.stringify({ type: 'PUSH_TOKEN', token: ${safeToken} })
      }));
      true;
    `);
  }, []);

  useEffect(() => {
    return onPushToken((token) => {
      if (pageLoadedRef.current) {
        injectPushToken(token);
      } else {
        pendingTokenRef.current = token;
      }
    });
  }, [injectPushToken]);

  const handleLoadEnd = useCallback(() => {
    pageLoadedRef.current = true;
    if (pendingTokenRef.current) {
      injectPushToken(pendingTokenRef.current);
      pendingTokenRef.current = null;
    }
  }, [injectPushToken]);

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
