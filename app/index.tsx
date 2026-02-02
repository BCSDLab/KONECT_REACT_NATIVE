import { useRef, useState, useEffect } from 'react';
import { BackHandler, Platform, StatusBar, StyleSheet, Linking, Alert } from 'react-native';
import { Slot } from 'expo-router';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { generateUserAgent } from '../utils/userAgent';
import { ShouldStartLoadRequest } from 'react-native-webview/lib/WebViewTypes';

const WEB_URL = 'https://agit.gg';
const userAgent = generateUserAgent();

const handleOnShouldStartLoadWithRequest = (event: ShouldStartLoadRequest) => {
  if (event.url.startsWith('http://') || event.url.startsWith('https://')) {
    return true;
  }

  Linking.canOpenURL(event.url)
    .then((canOpen) => {
      if (canOpen) {
        Linking.openURL(event.url);
      } else {
        Alert.alert('앱이 설치되지 않았습니다.');
      }
    })
    .catch((err) => {
      console.error(err);
    });
  return false;
};

export default function Index() {
  const webViewRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'android') {
      const onBackPress = () => {
        if (webViewRef.current && canGoBack) {
          webViewRef.current.goBack();
          return true;
        }
        return false;
      };
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }
  }, [canGoBack]);

  if (Platform.OS === 'web') {
    return <Slot />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={'dark-content'} />
      <WebView
        ref={webViewRef}
        onNavigationStateChange={(navState) => setCanGoBack(navState.canGoBack)}
        source={{ uri: WEB_URL }}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        thirdPartyCookiesEnabled
        sharedCookiesEnabled
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
  },
  webview: {
    flex: 1,
  },
});
