import { useEffect } from 'react';
import {
  Alert,
  BackHandler,
  Image,
  Linking,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const forceUpdateIllustration = require('../assets/images/force-update-illustration-v2.png');

const storeUrl = (): string => {
  if (Platform.OS === 'android') {
    return 'https://play.google.com/store/apps/details?id=com.bcsdlab.konect';
  } else if (Platform.OS === 'ios') {
    return 'https://apps.apple.com/kr/app/konect-%EB%8F%99%EC%95%84%EB%A6%AC/id6756885059';
  }
  return '';
};

export default function ForceUpdate() {
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => subscription.remove();
  }, []);

  async function openStore() {
    const url = storeUrl();
    if (!url) return;
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) {
        Alert.alert('스토어를 열 수 없습니다', '앱 스토어를 열 수 없습니다. 직접 스토어에서 업데이트해 주세요.');
        return;
      }
      await Linking.openURL(url);
    } catch {
      Alert.alert('스토어를 열 수 없습니다', '앱 스토어를 열 수 없습니다. 직접 스토어에서 업데이트해 주세요.');
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#E9E9E9" />
      <View style={styles.content}>
        <Image source={forceUpdateIllustration} style={styles.illustration} resizeMode="contain" />
        <View style={styles.textContainer}>
          <Text style={styles.title}>업데이트가 필요해요</Text>
          <Text style={styles.description}>
            원활한 서비스를 위해{'\n'}최신 버전으로 업데이트해 주세요
          </Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.updateButton, pressed && styles.updateButtonPressed]}
          onPress={openStore}
        >
          <Text style={styles.updateButtonText}>업데이트 하러가기</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 33.5,
    paddingTop: 140,
  },
  illustration: {
    width: 243,
    height: 162,
  },
  textContainer: {
    width: '100%',
    maxWidth: 323,
    marginTop: 12,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    lineHeight: 34,
    textAlign: 'center',
    fontWeight: '700',
    color: '#000000',
    letterSpacing: -0.4,
  },
  description: {
    marginTop: 12,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    fontWeight: '400',
    color: '#738293',
    letterSpacing: -0.2,
  },
  updateButton: {
    width: '100%',
    maxWidth: 323,
    height: 52,
    marginTop: 26,
    backgroundColor: '#69BFDF',
    borderRadius: 10,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  updateButtonPressed: {
    opacity: 0.85,
  },
  updateButtonText: {
    textAlign: 'center',
    color: '#F4F6F9',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
});
