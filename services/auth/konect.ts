import { apiUrl } from '../../constants/constants';
import { saveTokens } from '../tokenstore';

export interface TokenResponse {
  redirectUrl: string;
  accessToken: string | null;
  refreshToken: string | null;
  signupToken: string | null;
}

export const getTokens = async (
  provider: 'google' | 'apple' | 'kakao' | 'naver',
  idToken: string = '',
  accessToken: string = '',
  redirectUri: string = 'https://agit.gg'
): Promise<TokenResponse | null> => {
  try {
    const response = await fetch(`${apiUrl}/auth/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        provider: provider.toUpperCase(),
        idToken: idToken,
        accessToken: accessToken,
        redirectUri: redirectUri,
      }),
    });

    if (!response.ok) return null;

    const data: TokenResponse = await response.json();

    if (data.accessToken && data.refreshToken) {
      await saveTokens(data.accessToken, data.refreshToken);
    }

    return data;
  } catch (error) {
    console.error('Error fetching tokens:', error);
    return null;
  }
};
