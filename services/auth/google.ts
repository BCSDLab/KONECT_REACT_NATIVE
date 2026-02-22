import {
  GoogleSignin,
  isSuccessResponse,
  isErrorWithCode,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { getTokens, TokenResponse } from './konect';

export const configureGoogleSignIn = () => {
  GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_WEB_CLIENT_ID,
    offlineAccess: true,
    iosClientId: process.env.EXPO_PUBLIC_IOS_CLIENT_ID,
  });
};

export const googleSignIn = async (): Promise<TokenResponse | null> => {
  try {
    const hasPlayServices = await GoogleSignin.hasPlayServices();
    if (!hasPlayServices) {
      console.log('Google Play Services Not Available');
      return null;
    }

    const response = await GoogleSignin.signIn();

    if (isSuccessResponse(response)) {
      if (!response.data.idToken) {
        console.log('Google Sign-In Failed: No ID Token');
        return null;
      }
      return await getTokens('google', response.data.idToken ?? '');
    } else {
      console.log('Google Sign-In Cancelled');
      return null;
    }
  } catch (error) {
    if (isErrorWithCode(error)) {
      switch (error.code) {
        case statusCodes.IN_PROGRESS:
          console.log('Google Sign-In In Progress');
          return null;
        case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
          console.log('Google Play Services Not Available');
          return null;
        default:
          console.error('Google Sign-In Error:', error.code);
          return null;
      }
    } else {
      return null;
    }
  }
};
