import { Platform, StyleSheet, View } from 'react-native';
import { Slot } from 'expo-router';
import { WebView } from 'react-native-webview';

const WEB_URL = 'https://agit.gg';

export default function RootLayout() {
  if (Platform.OS === 'web') {
    return <Slot />;
  }

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: WEB_URL }}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        thirdPartyCookiesEnabled
        sharedCookiesEnabled
        applicationNameForUserAgent="KONECT_APP"
        startInLoadingState
      />
    </View>
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
