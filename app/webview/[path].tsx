import { useRef, useEffect } from 'react';
import { BackHandler, Platform, StatusBar, StyleSheet, Linking, Alert, AppState, AppStateStatus } from 'react-native';
import { Slot, useLocalSearchParams } from 'expo-router';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import CookieManager from '@react-native-cookies/cookies';
import { generateUserAgent } from '../../utils/userAgent';
import { ShouldStartLoadRequest } from 'react-native-webview/lib/WebViewTypes';

const WEB_URL = 'https://agit.gg';
const userAgent = generateUserAgent();

const handleOnShouldStartLoadWithRequest = ({ url }: ShouldStartLoadRequest) => {
  if (/^https?:\/\//i.test(url)) return true;
  if (url === 'about:blank') return false;
  (async () => {
    try {
      if (await Linking.canOpenURL(url)) {
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
        onNavigationStateChange={(navState) => { canGoBackRef.current = navState.canGoBack; }}
        source={{ uri: `${WEB_URL}/${local.path ?? ''}` }}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        thirdPartyCookiesEnabled={true}
        sharedCookiesEnabled={true}
        userAgent={userAgent}
        onShouldStartLoadWithRequest={handleOnShouldStartLoadWithRequest}
        originWhitelist={['*']}
        startInLoadingState
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
