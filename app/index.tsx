import { StyleSheet, Text, View, StatusBar, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import GoogleLogo from '../assets/svg/google.svg';
import KakaoLogo from '../assets/svg/kakao.svg';
import NaverLogo from '../assets/svg/naver.svg';
import AppleLogo from '../assets/svg/apple.svg';

export default function Index() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={'dark-content'} />
      <View style={styles.textContainer}>
        <Text style={styles.description}>
          모든 동아리를
          {'\n'}
          하나로 연결하다
        </Text>
        <Text style={styles.title}>KONECT</Text>
      </View>
      <View style={styles.buttonContainer}>
        <Text style={styles.socialText}>소셜 계정으로 로그인</Text>
        <View style={styles.socialButtonContainer}>
          <Pressable style={styles.googleLoginButton}>
            <GoogleLogo width={18} height={18} />
          </Pressable>
          <Pressable style={styles.kakaoLoginButton}>
            <KakaoLogo width={20} height={20} />
          </Pressable>
          <Pressable style={styles.naverLoginButton}>
            <NaverLogo width={18} height={18} />
          </Pressable>
          <Pressable style={styles.appleLoginButton}>
            <AppleLogo width={31} height={44} />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  textContainer: {
    paddingTop: 32,
    paddingHorizontal: 32,
    gap: 10,
  },
  title: {
    fontSize: 36,
    textAlign: 'left',
    fontWeight: '900',
  },
  description: {
    fontSize: 24,
    textAlign: 'left',
    fontWeight: '800',
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 72,
    gap: 12,
  },
  socialText: {
    fontSize: 14,
    color: '#6B7280',
  },
  socialButtonContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  googleLoginButton: {
    width: 44,
    height: 44,
    borderRadius: 50,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#E5E7EB',
  },
  kakaoLoginButton: {
    width: 44,
    height: 44,
    borderRadius: 50,
    backgroundColor: '#FEE500',
    alignItems: 'center',
    justifyContent: 'center',
  },
  naverLoginButton: {
    width: 44,
    height: 44,
    borderRadius: 50,
    backgroundColor: '#03c75a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appleLoginButton: {
    width: 44,
    height: 44,
    borderRadius: 50,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
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
