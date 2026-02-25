import { apiUrl } from '../constants/constants';
import * as SecureStore from 'expo-secure-store';
import { getAccessToken } from './nativeAuthStore';

const REQUEST_TIMEOUT_MS = 10_000;
const REGISTERED_PUSH_TOKEN_KEY = 'REGISTERED_PUSH_TOKEN';

let registeredPushTokenCache: string | null | undefined;
const inFlightRegisterRequests = new Map<string, Promise<void>>();

function fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  return fetch(url, { ...options, signal: controller.signal }).finally(() =>
    clearTimeout(timeoutId)
  );
}

async function getRegisteredPushToken(): Promise<string | null> {
  if (registeredPushTokenCache !== undefined) {
    return registeredPushTokenCache;
  }

  registeredPushTokenCache = await SecureStore.getItemAsync(REGISTERED_PUSH_TOKEN_KEY);
  return registeredPushTokenCache;
}

async function setRegisteredPushToken(token: string): Promise<void> {
  registeredPushTokenCache = token;
  await SecureStore.setItemAsync(REGISTERED_PUSH_TOKEN_KEY, token);
}

async function clearRegisteredPushToken(): Promise<void> {
  registeredPushTokenCache = null;
  await SecureStore.deleteItemAsync(REGISTERED_PUSH_TOKEN_KEY);
}

export async function registerPushToken(pushToken: string): Promise<void> {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    console.warn('registerPushToken: accessToken 없음, 등록 생략');
    return;
  }

  const alreadyRegistered = await getRegisteredPushToken();
  if (alreadyRegistered === pushToken) {
    return;
  }

  const inFlight = inFlightRegisterRequests.get(pushToken);
  if (inFlight) {
    return inFlight;
  }

  const request = (async () => {
    const res = await fetchWithTimeout(`${apiUrl}/notifications/tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ token: pushToken }),
    });

    if (!res.ok) {
      const errorBody = await res.text().catch(() => '');
      const isDuplicateTokenError =
        res.status === 409 || errorBody.includes('uq_notification_device_token_user_id');

      if (isDuplicateTokenError) {
        await setRegisteredPushToken(pushToken);
        return;
      }

      throw new Error(`registerPushToken failed: ${res.status}`);
    }

    await setRegisteredPushToken(pushToken);
  })();

  inFlightRegisterRequests.set(pushToken, request);

  try {
    await request;
  } finally {
    if (inFlightRegisterRequests.get(pushToken) === request) {
      inFlightRegisterRequests.delete(pushToken);
    }
  }
}

export async function unregisterPushToken(pushToken: string): Promise<void> {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    console.warn('unregisterPushToken: accessToken 없음, 삭제 생략');
    return;
  }

  const res = await fetchWithTimeout(`${apiUrl}/notifications/tokens`, {
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

  const registeredToken = await getRegisteredPushToken();
  if (registeredToken === pushToken) {
    await clearRegisteredPushToken();
  }
}
