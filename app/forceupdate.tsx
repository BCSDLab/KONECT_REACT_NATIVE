import {
  StyleSheet,
  Text,
  View,
  Platform,
  StatusBar,
  Linking,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { exitApp } from '@logicwind/react-native-exit-app';

const storeUrl = (): string => {
  if (Platform.OS === 'android') {
    return 'https://play.google.com/store/apps/details?id=com.bcsdlab.konect';
  } else if (Platform.OS === 'ios') {
    return 'https://apps.apple.com/kr/app/konect-%EB%8F%99%EC%95%84%EB%A6%AC/id6756885059';
  }
  return '';
};

export default function Modal() {
  function openStore() {
    Linking.openURL(storeUrl());
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={'dark-content'} />
      <Text style={styles.title}>업데이트가 필요해요!</Text>
      <View style={{ height: 10 }} />
      <Text style={styles.description}>KONECT를 사용하기 위해 업데이트가 필요해요</Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.updateButton} onPress={openStore}>
          <Text style={styles.updateButtonText}>업데이트 하러가기</Text>
        </TouchableOpacity>
        <View style={{ height: 12 }} />
        <TouchableOpacity style={styles.cancelButton} onPress={() => exitApp()}>
          <Text style={styles.cancelButtonText}>종료하기</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 40,
    flex: 1,
  },
  title: {
    fontSize: 24,
    paddingTop: 32,
    paddingHorizontal: 32,
    textAlign: 'left',
    fontWeight: 'bold',
  },
  description: {
    fontSize: 20,
    paddingHorizontal: 32,
    textAlign: 'left',
    fontWeight: 'semibold',
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 32,
  },
  updateButton: {
    height: 56,
    backgroundColor: '#007AFF',
    borderRadius: 8,
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
    borderWidth: 0.5,
    borderColor: '#D6DAE0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    textAlign: 'center',
    fontWeight: '600',
  },
});
