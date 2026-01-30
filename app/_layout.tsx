import React, { useRef, useState, useEffect } from 'react';
import { BackHandler, Platform, StyleSheet, View } from 'react-native';
import { Slot } from 'expo-router';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';

const WEB_URL = 'https://agit.gg';

export default function RootLayout() {
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
      BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }
  }, [canGoBack]);

  if (Platform.OS === 'web') {
    return <Slot />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <WebView
        ref={webViewRef}
        onNavigationStateChange={(navState) => setCanGoBack(navState.canGoBack)}
        source={{ uri: WEB_URL }}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        thirdPartyCookiesEnabled
        sharedCookiesEnabled
        applicationNameForUserAgent="KONECT_APP"
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
