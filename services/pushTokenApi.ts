import { apiUrl } from '../constants/constants';
import { getAccessToken } from './nativeAuthStore';

export async function registerPushToken(pushToken: string): Promise<void> {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    console.warn('registerPushToken: accessToken 없음, 등록 생략');
    return;
  }

  const res = await fetch(`${apiUrl}/notifications/tokens`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ token: pushToken }),
  });

  if (!res.ok) {
    throw new Error(`registerPushToken failed: ${res.status}`);
  }
}

export async function unregisterPushToken(pushToken: string): Promise<void> {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    console.warn('unregisterPushToken: accessToken 없음, 삭제 생략');
    return;
  }

  const res = await fetch(`${apiUrl}/notifications/tokens`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ token: pushToken }),
  });

  if (!res.ok) {
    throw new Error(`unregisterPushToken failed: ${res.status}`);
  }
}
