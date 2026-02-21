import { apiUrl } from '../../constants/constants';

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
  console.log('Requesting tokens with:', { provider, idToken, accessToken, redirectUri });
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

    return data;
  } catch (error) {
    console.error('Error fetching tokens:', error);
    return null;
  }
};
