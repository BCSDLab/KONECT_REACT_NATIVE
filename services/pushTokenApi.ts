import { apiUrl } from '../constants/constants';
import * as SecureStore from 'expo-secure-store';
import { getAccessToken } from './nativeAuthStore';

const REQUEST_TIMEOUT_MS = 10_000;
const REGISTERED_PUSH_TOKEN_KEY = 'REGISTERED_PUSH_TOKEN';

let registrationCache: string | null | undefined;
const inFlightRegisterRequests = new Map<string, Promise<void>>();

function fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  return fetch(url, { ...options, signal: controller.signal }).finally(() =>
    clearTimeout(timeoutId)
  );
}

function getUserIdFromAccessToken(accessToken: string): string | null {
  try {
    const payload = accessToken.split('.')[1];
    if (!payload) return null;

    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const { id } = JSON.parse(atob(padded)) as { id?: unknown };

    return typeof id === 'number' || typeof id === 'string' ? String(id) : null;
  } catch {
    return null;
  }
}

// 세션 만료로 LOGOUT 없이 다른 사용자가 로그인할 수 있어, 등록 여부를 토큰만이 아니라 사용자 단위로 기억한다.
function toRegistrationKey(userId: string, pushToken: string): string {
  return `${userId}:${pushToken}`;
}

async function getRegistration(): Promise<string | null> {
  if (registrationCache !== undefined) {
    return registrationCache;
  }

  registrationCache = await SecureStore.getItemAsync(REGISTERED_PUSH_TOKEN_KEY);
  return registrationCache;
}

async function setRegistration(registrationKey: string): Promise<void> {
  registrationCache = registrationKey;
  await SecureStore.setItemAsync(REGISTERED_PUSH_TOKEN_KEY, registrationKey);
}

async function clearRegistration(): Promise<void> {
  registrationCache = null;
  await SecureStore.deleteItemAsync(REGISTERED_PUSH_TOKEN_KEY);
}

export async function registerPushToken(pushToken: string): Promise<void> {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    console.warn('registerPushToken: accessToken 없음, 등록 생략');
    return;
  }

  const userId = getUserIdFromAccessToken(accessToken);
  const registrationKey = userId ? toRegistrationKey(userId, pushToken) : null;

  if (registrationKey && (await getRegistration()) === registrationKey) {
    return;
  }

  const inFlightKey = registrationKey ?? pushToken;
  const inFlight = inFlightRegisterRequests.get(inFlightKey);
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

      if (!isDuplicateTokenError) {
        throw new Error(`registerPushToken failed: ${res.status}`);
      }
    }

    if (registrationKey) {
      await setRegistration(registrationKey);
    }
  })();

  inFlightRegisterRequests.set(inFlightKey, request);

  try {
    await request;
  } finally {
    if (inFlightRegisterRequests.get(inFlightKey) === request) {
      inFlightRegisterRequests.delete(inFlightKey);
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

  const registration = await getRegistration();
  if (registration === pushToken || registration?.endsWith(`:${pushToken}`)) {
    await clearRegistration();
  }
}
