import {
  StyleSheet,
  Text,
  View,
  Platform,
  StatusBar,
  Linking,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { exitApp } from '@logicwind/react-native-exit-app';

const storeUrl = (): string => {
  if (Platform.OS === 'android') {
    return 'https://play.google.com/store/apps/details?id=com.bcsdlab.konect';
  } else if (Platform.OS === 'ios') {
    return 'https://apps.apple.com/kr/app/konect-%EB%8F%99%EC%95%84%EB%A6%AC/id6756885059';
  }
  return '';
};

export default function ForceUpdate() {
  function openStore() {
    Linking.openURL(storeUrl());
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={'dark-content'} />
      <View style={styles.textContainer}>
        <Text style={styles.title}>업데이트가 필요해요!</Text>
        <Text style={styles.description}>KONECT를 사용하기 위해 업데이트가 필요해요</Text>
      </View>
      <View style={styles.buttonContainer}>
        <Pressable style={styles.updateButton} onPress={openStore}>
          <Text style={styles.updateButtonText}>업데이트 하러가기</Text>
        </Pressable>
        <Pressable style={styles.cancelButton} onPress={() => exitApp()}>
          <Text style={styles.cancelButtonText}>종료하기</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  textContainer: {
    paddingTop: 32,
    paddingHorizontal: 32,
    gap: 10,
  },
  title: {
    fontSize: 24,
    textAlign: 'left',
    fontWeight: 'bold',
  },
  description: {
    fontSize: 20,
    textAlign: 'left',
    fontWeight: 'semibold',
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 32,
    gap: 12,
  },
  updateButton: {
    height: 56,
    backgroundColor: '#323532',
    borderRadius: 8,
    borderCurve: 'continuous',
    borderWidth: 0.5,
    borderColor: '#D6DAE0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  updateButtonText: {
    textAlign: 'center',
    color: '#FFFFFF',
  },
  cancelButton: {
    height: 56,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderCurve: 'continuous',
    borderWidth: 0.5,
    borderColor: '#D6DAE0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: '#021730',
    textAlign: 'center',
    fontWeight: '600',
  },
});
